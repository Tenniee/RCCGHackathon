
"""
OTP Router — optional module.
Include or exclude this in main.py depending on OTP_ENABLED setting.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.otp_module.otp_service import send_otp, verify_otp

router = APIRouter(prefix="/otp", tags=["OTP (Optional)"])


class OTPVerifyRequest(BaseModel):
    code: str


@router.post("/send")
def send_otp_endpoint(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Sends a 6-digit OTP to the current user's phone via Termii SMS."""
    return send_otp(db, current_user.id, current_user.phone)


@router.post("/verify")
def verify_otp_endpoint(
    payload: OTPVerifyRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Verifies the OTP and marks the user's phone as verified."""
    return verify_otp(db, current_user.id, payload.code)