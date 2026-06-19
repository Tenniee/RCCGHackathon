"""
Optional OTP Phone Verification Module
=======================================
This entire module can be removed without breaking any other part of the app.
It is only activated when OTP_ENABLED=true in .env.

To ENABLE:
  1. Set OTP_ENABLED=true in your .env
  2. Add TERMII_API_KEY and TERMII_SENDER_ID to .env
  3. In main.py, uncomment: app.include_router(otp_router)

To REMOVE:
  1. Delete this file and otp_router.py
  2. Remove the include_router line from main.py
  Nothing else changes.

Flow:
  POST /otp/send   → generates a 6-digit code, stores hashed in DB, sends via Termii
  POST /otp/verify → verifies the code, sets user.phone_verified = True
"""

import random
import string
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Session

from app.core.database import Base
from app.core.config import get_settings

settings = get_settings()

# ─── OTP DB model (only created if OTP_ENABLED) ──────────────────────────────

class OTPCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    code_hash = Column(String(64), nullable=False)   # SHA-256 of the 6-digit code
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _generate_code() -> str:
    return "".join(random.choices(string.digits, k=6))


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()


def _send_via_termii(phone: str, code: str) -> None:
    """
    Sends OTP via Termii SMS API.
    Raises HTTPException if Termii is not configured or returns an error.
    """
    import httpx

    if not settings.TERMII_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OTP service is not configured. Contact support.",
        )

    # Normalise Nigerian number to international format
    normalized = phone.strip().replace(" ", "").replace("-", "")
    if normalized.startswith("0"):
        normalized = "234" + normalized[1:]
    elif normalized.startswith("+"):
        normalized = normalized[1:]

    payload = {
        "to": normalized,
        "from": settings.TERMII_SENDER_ID,
        "sms": f"Your RCCG Ride Connect verification code is: {code}. Valid for 10 minutes.",
        "type": "plain",
        "channel": "generic",
        "api_key": settings.TERMII_API_KEY,
    }

    try:
        response = httpx.post(
            "https://api.ng.termii.com/api/sms/send",
            json=payload,
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to send OTP via Termii: {str(exc)}",
        )


# ─── Service functions ────────────────────────────────────────────────────────

def send_otp(db: Session, user_id: int, phone: str) -> dict:
    if not settings.OTP_ENABLED:
        return {"message": "OTP module is disabled. Phone verification is optional."}

    # Invalidate any existing unused codes for this user
    db.query(OTPCode).filter(
        OTPCode.user_id == user_id,
        OTPCode.used == False,
    ).update({"used": True})
    db.commit()

    code = _generate_code()
    otp = OTPCode(
        user_id=user_id,
        code_hash=_hash_code(code),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=10),
    )
    db.add(otp)
    db.commit()

    _send_via_termii(phone, code)

    return {"message": f"OTP sent to {phone[-4:].rjust(len(phone), '*')}"}


def verify_otp(db: Session, user_id: int, code: str) -> dict:
    if not settings.OTP_ENABLED:
        return {"message": "OTP module is disabled."}

    otp = (
        db.query(OTPCode)
        .filter(
            OTPCode.user_id == user_id,
            OTPCode.code_hash == _hash_code(code),
            OTPCode.used == False,
            OTPCode.expires_at > datetime.now(timezone.utc),
        )
        .first()
    )

    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code.",
        )

    otp.used = True

    # Mark user's phone as verified
    from app.models.user import User
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.phone_verified = True

    db.commit()
    return {"message": "Phone number verified successfully."}

