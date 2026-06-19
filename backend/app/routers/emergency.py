from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_verified_user
from app.models.user import User
from app.schemas.rides_etc import (
    EmergencyAlertCreate, EmergencyAlertResponse,
    RatingCreate, RatingResponse,
)
from app.services.emergency_service import trigger_emergency_alert, submit_rating

router = APIRouter(tags=["Emergency & Ratings"])


# ─── Emergency alert ──────────────────────────────────────────────────────────

@router.post(
    "/emergency/alert",
    response_model=EmergencyAlertResponse,
    status_code=status.HTTP_201_CREATED,
)
def trigger_sos(
    payload: EmergencyAlertCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """
    Triggered when a rider double-taps the SOS button during an active ride.

    What happens:
      1. An EmergencyAlert row is created with a snapshot of the ride
         (driver name, car details, destination, meetup point).
      2. The rider's trusted contact details are copied into the alert row.
      3. In-app notification sent to the trusted contact if they are a user.
      4. Alert is flagged for admin review.

    Silent — no sound or visible indication is shown to the driver.

    Coming later:
      - Live GPS coordinates attached to alert  → Google Maps SDK
      - SMS to trusted contact                  → Termii SMS API
    """
    alert = trigger_emergency_alert(db, current_user, payload)
    return alert


@router.get("/emergency/my-alerts", response_model=list[EmergencyAlertResponse])
def my_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """Returns the current user's emergency alert history."""
    from app.models.emergency import EmergencyAlert
    return (
        db.query(EmergencyAlert)
        .filter(EmergencyAlert.user_id == current_user.id)
        .order_by(EmergencyAlert.created_at.desc())
        .all()
    )