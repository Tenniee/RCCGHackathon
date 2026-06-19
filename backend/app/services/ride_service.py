"""
Core ride business logic.
 
Car-reveal rule:
  A rider only sees car details (make, model, colour, plate) once their
  RideRequest.status == 'accepted'. The rides router enforces this by
  calling `build_ride_detail_response` which checks the request status.
"""
 
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
 
from app.models.ride import Ride, RideStatus
from app.models.ride_request import RideRequest, RequestStatus
from app.models.message import MessageThread
from app.models.user import User
from app.schemas.ride import RideCreateRequest, RideFeedItem, RideDetailResponse, RideFeedFilter
from app.schemas.rides_etc import RideRequestAccept
 
 
# ─── Post a ride ─────────────────────────────────────────────────────────────
 
def post_ride(db: Session, driver: User, payload: RideCreateRequest) -> Ride:
    ride = Ride(
        driver_id=driver.id,
        origin=payload.origin,
        destination=payload.destination,
        route_description=payload.route_description,
        departure_time=payload.departure_time,
        total_seats=payload.total_seats,
        cost_per_rider=payload.cost_per_rider,
        driver_note=payload.driver_note,
    )
    db.add(ride)
    db.commit()
    db.refresh(ride)
    return ride
 
 
# ─── Feed ────────────────────────────────────────────────────────────────────
 
def get_ride_feed(
    db: Session,
    filters: RideFeedFilter,
    skip: int = 0,
    limit: int = 30,
) -> list[Ride]:
    q = db.query(Ride).filter(Ride.status == RideStatus.open)
 
    if filters.destination:
        q = q.filter(
            func.lower(Ride.destination).contains(filters.destination.lower())
        )
 
    if filters.route_keyword:
        q = q.filter(
            func.lower(Ride.route_description).contains(filters.route_keyword.lower())
        )
 
    if filters.max_cost is not None:
        q = q.filter(Ride.cost_per_rider <= filters.max_cost)
 
    # Gender filter: join to driver user record
    if filters.driver_gender in ("male", "female"):
        # We don't store gender explicitly — but selfie/NIN upload serves this purpose.
        # For now, driver_gender filtering is a planned feature.
        # TODO: add `gender` field to User model in next sprint.
        pass
 
    return q.order_by(Ride.created_at.desc()).offset(skip).limit(limit).all()
 
 
# ─── Ride detail with conditional car reveal ──────────────────────────────────
 
def build_ride_detail_response(
    ride: Ride,
    current_user: User,
    db: Session,
) -> RideDetailResponse:
    """
    Returns ride detail. Car details are populated only if:
      - the current user is the driver of this ride, OR
      - the current user has an ACCEPTED request on this ride.
    """
    reveal_car = False
 
    if current_user.id == ride.driver_id:
        reveal_car = True
    else:
        accepted = (
            db.query(RideRequest)
            .filter(
                RideRequest.ride_id == ride.id,
                RideRequest.rider_id == current_user.id,
                RideRequest.status == RequestStatus.accepted,
            )
            .first()
        )
        if accepted:
            reveal_car = True
 
    from app.schemas.user import UserPublic
    driver_public = UserPublic.model_validate(ride.driver)
 
    base = RideFeedItem(
        id=ride.id,
        origin=ride.origin,
        destination=ride.destination,
        route_description=ride.route_description,
        departure_time=ride.departure_time,
        total_seats=ride.total_seats,
        seats_taken=ride.seats_taken,
        seats_available=ride.seats_available,
        cost_per_rider=ride.cost_per_rider,
        driver_note=ride.driver_note,
        status=ride.status,
        created_at=ride.created_at,
        driver=driver_public,
    )
 
    detail = RideDetailResponse(
        **base.model_dump(),
        car_make=ride.driver.car_make if reveal_car else None,
        car_model=ride.driver.car_model if reveal_car else None,
        car_year=ride.driver.car_year if reveal_car else None,
        car_colour=ride.driver.car_colour if reveal_car else None,
        car_plate=ride.driver.car_plate if reveal_car else None,
        car_photo_url=ride.driver.car_photo_url if reveal_car else None,
    )
    return detail
 
 
# ─── Send a ride request ──────────────────────────────────────────────────────
 
def create_ride_request(db: Session, rider: User, ride_id: int, drop_off_note: str | None) -> RideRequest:
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.is_full:
        raise HTTPException(status_code=409, detail="This ride is full.")
    if ride.driver_id == rider.id:
        raise HTTPException(status_code=400, detail="You cannot request to join your own ride.")
    if ride.status != RideStatus.open:
        raise HTTPException(status_code=409, detail="This ride is no longer accepting requests.")
 
    # Prevent duplicate requests
    existing = (
        db.query(RideRequest)
        .filter(
            RideRequest.ride_id == ride_id,
            RideRequest.rider_id == rider.id,
            RideRequest.status.in_([RequestStatus.pending, RequestStatus.accepted]),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="You already have an active request for this ride.")
 
    # Create a message thread for this request
    thread = MessageThread(
        driver_id=ride.driver_id,
        rider_id=rider.id,
        ride_id=ride.id,
    )
    db.add(thread)
    db.flush()  # get thread.id before commit
 
    ride_request = RideRequest(
        ride_id=ride_id,
        rider_id=rider.id,
        drop_off_note=drop_off_note,
        thread_id=thread.id,
    )
    db.add(ride_request)
    db.commit()
    db.refresh(ride_request)
    return ride_request
 
 
# ─── Driver accepts a request ─────────────────────────────────────────────────
 
def accept_ride_request(
    db: Session,
    driver: User,
    request_id: int,
    payload: RideRequestAccept,
) -> RideRequest:
    req = (
        db.query(RideRequest)
        .join(Ride)
        .filter(
            RideRequest.id == request_id,
            Ride.driver_id == driver.id,
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found or not yours to manage.")
    if req.status != RequestStatus.pending:
        raise HTTPException(status_code=409, detail=f"Request is already '{req.status}'.")
 
    req.status = RequestStatus.accepted
    req.meetup_point = payload.meetup_point
    req.ride.seats_taken += 1
 
    if req.ride.is_full:
        req.ride.status = RideStatus.full
 
    db.commit()
    db.refresh(req)
    return req
 
 
# ─── Driver declines a request ────────────────────────────────────────────────
 
def decline_ride_request(db: Session, driver: User, request_id: int) -> RideRequest:
    req = (
        db.query(RideRequest)
        .join(Ride)
        .filter(
            RideRequest.id == request_id,
            Ride.driver_id == driver.id,
        )
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    req.status = RequestStatus.declined
    db.commit()
    db.refresh(req)
    return req
 
 
# ─── Rider cancels their own request ─────────────────────────────────────────
 
def cancel_ride_request(db: Session, rider: User, request_id: int) -> RideRequest:
    req = (
        db.query(RideRequest)
        .filter(RideRequest.id == request_id, RideRequest.rider_id == rider.id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    if req.status == RequestStatus.accepted:
        req.ride.seats_taken = max(0, req.ride.seats_taken - 1)
        if req.ride.status == RideStatus.full:
            req.ride.status = RideStatus.open
    req.status = RequestStatus.cancelled
    db.commit()
    db.refresh(req)
    return req
 
 
# ─── Complete a ride ──────────────────────────────────────────────────────────
 
def complete_ride(db: Session, driver: User, ride_id: int) -> Ride:
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == driver.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    ride.status = RideStatus.completed
    ride.driver.total_rides += 1
    db.commit()
    db.refresh(ride)
    return ride
 
 
# ─── Start a ride ─────────────────────────────────────────────────────────────
 
def start_ride(db: Session, driver: User, ride_id: int) -> Ride:
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == driver.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.status not in (RideStatus.open, RideStatus.full):
        raise HTTPException(
            status_code=409,
            detail=f"Cannot start a ride with status '{ride.status}'.",
        )
    ride.status = RideStatus.in_progress
    db.commit()
    db.refresh(ride)
    return ride
 
 
# ─── Cancel a posted ride (driver only) ──────────────────────────────────────
 
def cancel_posted_ride(db: Session, driver: User, ride_id: int) -> Ride:
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == driver.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    if ride.status in (RideStatus.completed, RideStatus.cancelled):
        raise HTTPException(
            status_code=409,
            detail=f"Ride is already '{ride.status}' and cannot be cancelled.",
        )
    # Decline all pending requests so riders get notified
    db.query(RideRequest).filter(
        RideRequest.ride_id == ride_id,
        RideRequest.status == RequestStatus.pending,
    ).update({"status": RequestStatus.declined})
    ride.status = RideStatus.cancelled
    db.commit()
    db.refresh(ride)
    return ride
