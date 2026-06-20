"""
Emergency alert service.
 
When a rider double-taps the SOS button:
  1. Frontend calls POST /emergency/alert with the ride_request_id.
  2. This service creates an EmergencyAlert row with the rider's trusted contact info.
  3. An in-app notification is created for the trusted contact (if they are also a user).
  4. The alert is also stored so admins can review safety incidents.
 
Live GPS location — added later via Google Maps SDK integration.
SMS to trusted contact    — added later via Termii SMS API.
"""
 
import json
from datetime import datetime, timezone
from fastapi import HTTPException
from sqlalchemy.orm import Session
 
from app.models.emergency import EmergencyAlert, Rating
from app.models.ride_request import RideRequest, RequestStatus
from app.models.user import User
from app.schemas.rides_etc import EmergencyAlertCreate, RatingCreate
 
 
# ─── Emergency alert ──────────────────────────────────────────────────────────
 
def trigger_emergency_alert(
    db: Session,
    user: User,
    payload: EmergencyAlertCreate,
) -> EmergencyAlert:
    # Build a ride snapshot for the alert record
    snapshot = {}
    if payload.ride_request_id:
        req = db.query(RideRequest).filter(RideRequest.id == payload.ride_request_id).first()
        if req and req.rider_id == user.id:
            driver = req.ride.driver
            snapshot = {
                "ride_id": req.ride_id,
                "driver_name": driver.full_name,
                "driver_phone": driver.phone,
                "car_make": driver.car_make,
                "car_colour": driver.car_colour,
                "car_plate": driver.car_plate,
                "destination": req.ride.destination,
                "meetup_point": req.meetup_point,
            }
 
    alert = EmergencyAlert(
        user_id=user.id,
        ride_request_id=payload.ride_request_id,
        ride_snapshot=json.dumps(snapshot),
        trusted_contact_phone=user.emergency_contact_phone,
        trusted_contact_name=user.emergency_contact_name,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
 
    # TODO: send in-app push notification to trusted contact if they are a user.
    # TODO: send SMS via Termii once OTP module is enabled.
 
    return alert
 
 
def resolve_alert(db: Session, alert_id: int, admin_user: User, note: str) -> EmergencyAlert:
    alert = db.query(EmergencyAlert).filter(EmergencyAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.resolved = True
    alert.resolved_note = note
    alert.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)
    return alert
 
 
# ─── Rating service ───────────────────────────────────────────────────────────
 
def submit_rating(db: Session, rater: User, payload: RatingCreate) -> Rating:
    from sqlalchemy.orm import joinedload
    from app.models.ride import Ride
 
    # Eagerly load the ride so req.ride is always populated
    req = (
        db.query(RideRequest)
        .options(joinedload(RideRequest.ride))
        .filter(RideRequest.id == payload.ride_request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Ride request not found.")
 
    if not req.ride:
        raise HTTPException(status_code=404, detail="Ride not found for this request.")
 
    driver_id = req.ride.driver_id
    rider_id  = req.rider_id
 
    if rater.id not in (driver_id, rider_id):
        raise HTTPException(status_code=403, detail="You were not part of this ride.")
 
    # Allow rating once request is accepted — ride may be in_progress or completed
    if req.status != RequestStatus.accepted:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot rate — request status is '{req.status}'. Must be accepted."
        )
 
    # Prevent duplicate ratings
    existing = db.query(Rating).filter(
        Rating.rater_id == rater.id,
        Rating.ride_request_id == payload.ride_request_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You have already rated this ride.")
 
    # Validate ratee is the other party
    if payload.ratee_id not in (driver_id, rider_id) or payload.ratee_id == rater.id:
        raise HTTPException(status_code=400, detail="Invalid ratee for this ride.")
 
    rating = Rating(
        rater_id=rater.id,
        ratee_id=payload.ratee_id,
        ride_request_id=payload.ride_request_id,
        score=payload.score,
        comment=payload.comment,
        tags=payload.tags,
    )
    db.add(rating)
 
    # Recompute the ratee's average
    ratee = db.query(User).filter(User.id == payload.ratee_id).first()
    new_total = ratee.total_ratings + 1
    new_avg = ((ratee.average_rating * ratee.total_ratings) + payload.score) / new_total
    ratee.average_rating = round(new_avg, 2)
    ratee.total_ratings = new_total
 
    db.commit()
    db.refresh(rating)
    return rating