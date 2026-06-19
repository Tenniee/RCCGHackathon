from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, get_current_verified_user
from app.models.user import User
from app.schemas.user import (
    DocumentUploadRequest, DocumentUploadResponse,
    CarDetailsRequest, EmergencyContactRequest,
    UserPublic,
)
from app.services.cloudinary_service import save_document_url

router = APIRouter(prefix="/users", tags=["Users"])


# ─── Document upload ──────────────────────────────────────────────────────────

@router.post(
    "/me/documents",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_200_OK,
)
def upload_document(
    payload: DocumentUploadRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Stores a Cloudinary URL for a user document.

    Flow:
      1. Frontend uploads image/video directly to Cloudinary
         (using the signature from GET /auth/cloudinary-signature).
      2. Cloudinary returns a secure_url.
      3. Frontend calls this endpoint with doc_type + cloudinary_url.
      4. Backend validates the URL is a genuine Cloudinary URL and saves it.

    doc_type values:
      - selfie      → profile photo / short selfie video (all users)
      - nin         → NIN slip or NIN card scan (all users)
      - licence     → driver's licence front photo (drivers only)
      - car_photo   → exterior car photo (drivers only)

    Admin verification:
      After all required documents are uploaded, an admin reviews them
      in the admin panel and sets is_verified = True on the user record.
      Until verified, the user cannot post or request rides.
    """
    updated_user = save_document_url(db, current_user, payload.doc_type, payload.cloudinary_url)
    return DocumentUploadResponse(
        message=f"{payload.doc_type} saved successfully. Pending admin verification.",
        doc_type=payload.doc_type,
        url=payload.cloudinary_url,
    )


# ─── Car details (driver only) ────────────────────────────────────────────────

@router.put("/me/car-details", response_model=UserPublic)
def update_car_details(
    payload: CarDetailsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Driver saves their car make, model, year, colour, and plate.
    These are hidden from riders until a request is accepted.
    """
    if current_user.role != "driver":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Only drivers can set car details.")

    current_user.car_make = payload.car_make
    current_user.car_model = payload.car_model
    current_user.car_year = payload.car_year
    current_user.car_colour = payload.car_colour
    current_user.car_plate = payload.car_plate
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── Emergency contact ────────────────────────────────────────────────────────

@router.put("/me/emergency-contact", response_model=UserPublic)
def update_emergency_contact(
    payload: EmergencyContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Saves the user's trusted emergency contact (name + phone).
    This contact receives an in-app alert when the rider triggers SOS.
    """
    current_user.emergency_contact_name = payload.name
    current_user.emergency_contact_phone = payload.phone
    db.commit()
    db.refresh(current_user)
    return current_user


# ─── View any user's public profile ──────────────────────────────────────────

@router.get("/{user_id}", response_model=UserPublic)
def get_user_profile(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """
    Returns a user's public profile.
    Used when a driver views a rider's profile before accepting their request.
    Note: car details are NOT included here — they are gated by ride acceptance.
    """
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user
