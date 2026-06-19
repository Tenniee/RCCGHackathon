from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
 
from app.core.database import get_db
from app.core.security import get_current_user
from app.schemas.user import (
    UserSignupRequest, LoginRequest, TokenResponse,
    DocumentUploadRequest, DocumentUploadResponse,
    CarDetailsRequest, EmergencyContactRequest,
    UserPublic,
)
from app.services.auth_service import signup_user, login_user, verify_password
from app.services.cloudinary_service import save_document_url, get_cloudinary_signature
 
 
class DeleteAccountRequest(BaseModel):
    password: str   # user must confirm their password before deletion
 
router = APIRouter(prefix="/auth", tags=["Auth"])
 
 
# ─── POST /auth/signup ────────────────────────────────────────────────────────
@router.post("/signup", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def signup(payload: UserSignupRequest, db: Session = Depends(get_db)):
    """
    Register a new rider or driver.
    Account starts unverified — admin must approve after reviewing documents.
    """
    return signup_user(db, payload)
 
 
# ─── POST /auth/login  (JSON — your real frontend uses this) ──────────────────
@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """
    Login with phone + password (JSON body).
    Returns a JWT valid for 7 days.
 
    Example body:
        { "phone": "08012345678", "password": "yourpassword" }
    """
    return login_user(db, payload)
 
 
# ─── POST /auth/token  (form — used by Swagger UI Authorize button only) ─────
@router.post(
    "/token",
    response_model=TokenResponse,
    include_in_schema=True,
    summary="Swagger UI login (use /auth/login for your app)",
    tags=["Auth"],
)
def token_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    """
    This endpoint exists ONLY for the Swagger UI "Authorize" button.
    It accepts the OAuth2 form fields (username = your phone, password = your password).
    Your React frontend should use POST /auth/login with a JSON body instead.
    """
    # Swagger sends phone as 'username' — map it back
    payload = LoginRequest(phone=form_data.username, password=form_data.password)
    return login_user(db, payload)
 
 
# ─── GET /auth/me ─────────────────────────────────────────────────────────────
@router.get("/me", response_model=UserPublic)
def get_me(current_user=Depends(get_current_user)):
    """Returns the authenticated user's profile."""
    return current_user
 
 
# ─── GET /auth/cloudinary-signature ──────────────────────────────────────────
@router.get("/cloudinary-signature")
def cloudinary_signature(current_user=Depends(get_current_user)):
    """
    Returns short-lived Cloudinary upload params.
    Frontend uploads file directly to Cloudinary, then POSTs the secure_url
    to POST /users/me/documents.
    """
    return get_cloudinary_signature()
 
 
# ─── POST /auth/me/documents ──────────────────────────────────────────────────
@router.post("/me/documents", response_model=DocumentUploadResponse)
def upload_document(
    payload: DocumentUploadRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Saves a Cloudinary URL for a document.
    doc_type: selfie | nin | licence | car_photo
    """
    user = save_document_url(db, current_user, payload.doc_type, payload.cloudinary_url)
    return DocumentUploadResponse(
        message="Document saved. Pending admin review.",
        doc_type=payload.doc_type,
        url=payload.cloudinary_url,
    )
 
 
# ─── PUT /auth/me/car-details ─────────────────────────────────────────────────
@router.put("/me/car-details", response_model=UserPublic)
def update_car_details(
    payload: CarDetailsRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Drivers set their car make/model/colour/plate (hidden until request accepted)."""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Only drivers can set car details.")
    current_user.car_make   = payload.car_make
    current_user.car_model  = payload.car_model
    current_user.car_year   = payload.car_year
    current_user.car_colour = payload.car_colour
    current_user.car_plate  = payload.car_plate
    db.commit()
    db.refresh(current_user)
    return current_user
 
 
# ─── PUT /auth/me/emergency-contact ──────────────────────────────────────────
@router.put("/me/emergency-contact", response_model=UserPublic)
def update_emergency_contact(
    payload: EmergencyContactRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Stores the trusted contact for the silent SOS alert."""
    current_user.emergency_contact_name  = payload.name
    current_user.emergency_contact_phone = payload.phone
    db.commit()
    db.refresh(current_user)
    return current_user
 
 
# ─── DELETE /auth/me ──────────────────────────────────────────────────────────
@router.delete("/me", status_code=status.HTTP_200_OK)
def delete_account(
    payload: DeleteAccountRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    Permanently deletes the authenticated user's account.
 
    Requires the user's current password as confirmation — so a stolen JWT
    alone cannot silently wipe an account.
 
    What gets cleaned up before deletion:
      - Driver: all open/in-progress rides marked cancelled, pending
        requests on those rides declined so riders are not left hanging.
      - Rider: all their own pending requests cancelled.
      - Then the user row is deleted (DB cascades handle related rows).
 
    Cloudinary documents (selfie, NIN, etc.) are NOT deleted automatically —
    clean those up via the Cloudinary API in an admin panel or background job.
    """
    from app.models.ride import Ride, RideStatus
    from app.models.ride_request import RideRequest, RequestStatus
 
    # 1. Confirm password before doing anything destructive
    if not verify_password(payload.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Account not deleted.",
        )
 
    # 2. Driver cleanup — cancel open rides and decline pending requests on them
    if current_user.role == "driver":
        open_rides = (
            db.query(Ride)
            .filter(
                Ride.driver_id == current_user.id,
                Ride.status.in_([RideStatus.open, RideStatus.in_progress]),
            )
            .all()
        )
        for ride in open_rides:
            db.query(RideRequest).filter(
                RideRequest.ride_id == ride.id,
                RideRequest.status == RequestStatus.pending,
            ).update({"status": RequestStatus.declined})
            ride.status = RideStatus.cancelled
        db.flush()
 
    # 3. Rider cleanup — cancel their own pending requests
    if current_user.role == "rider":
        db.query(RideRequest).filter(
            RideRequest.rider_id == current_user.id,
            RideRequest.status == RequestStatus.pending,
        ).update({"status": RequestStatus.cancelled})
        db.flush()
 
    # 4. Delete the user row
    user_name = current_user.full_name
    db.delete(current_user)
    db.commit()
 
    return {
        "message": f"Account for '{user_name}' has been permanently deleted.",
        "note": "Uploaded documents on Cloudinary are not automatically removed.",
    }
