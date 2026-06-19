"""
Cloudinary integration.
 
Upload flow:
  1. Frontend calls Cloudinary's upload API directly (using unsigned preset
     or a short-lived signature from /auth/cloudinary-signature).
  2. Cloudinary returns a secure_url.
  3. Frontend POSTs that URL to /users/me/documents.
  4. This service validates the URL is a genuine Cloudinary URL and saves it.
 
This keeps API secrets off the client while avoiding a large binary upload
going through our server.
"""
 
import re
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
 
from app.models.user import User
from app.core.config import get_settings
 
settings = get_settings()
 
CLOUDINARY_URL_PATTERN = re.compile(
    r"^https://res\.cloudinary\.com/[^/]+/(image|video|raw)/upload/.+$"
)
 
 
def _validate_cloudinary_url(url: str) -> None:
    """Reject obviously fake URLs before we store them."""
    if not CLOUDINARY_URL_PATTERN.match(url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Invalid Cloudinary URL. "
                "Upload your file to Cloudinary first, then submit the secure_url here."
            ),
        )
 
 
DOC_TYPE_TO_FIELD = {
    "selfie": "selfie_url",
    "nin": "nin_url",
    "licence": "licence_url",
    "car_photo": "car_photo_url",
}
 
DRIVER_ONLY_DOCS = {"licence", "car_photo"}
 
 
def save_document_url(db: Session, user: User, doc_type: str, url: str) -> User:
    """
    Validates the Cloudinary URL and writes it to the correct user field.
    Raises 403 if a rider tries to upload a driver-only document.
    """
    _validate_cloudinary_url(url)
 
    if doc_type in DRIVER_ONLY_DOCS and user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only drivers can upload '{doc_type}' documents.",
        )
 
    field = DOC_TYPE_TO_FIELD.get(doc_type)
    if not field:
        raise HTTPException(status_code=400, detail="Unknown doc_type")
 
    setattr(user, field, url)
    db.commit()
    db.refresh(user)
    return user
 
 
def get_cloudinary_signature(folder: str = "rccg_ride_connect") -> dict:
    """
    Returns a short-lived upload signature so the frontend can upload
    directly to Cloudinary without exposing the API secret.
    Requires CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.
    """
    import cloudinary
    import cloudinary.utils
    import time
 
    if not settings.CLOUDINARY_CLOUD_NAME:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary is not configured on this server.",
        )
 
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
    )
 
    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, settings.CLOUDINARY_API_SECRET)
 
    return {
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "api_key": settings.CLOUDINARY_API_KEY,
        "timestamp": timestamp,
        "signature": signature,
        "folder": folder,
    }