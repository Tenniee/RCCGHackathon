from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
 
from app.core.database import get_db
from app.core.security import get_current_user, get_current_driver
from app.models.user import User
from app.schemas.ride import RideCreateRequest, RideFeedItem, RideDetailResponse, RideFeedFilter
from app.schemas.rides_etc import (
    RideRequestCreate, RideRequestResponse, RideRequestAccept,
)
from app.services.ride_service import (
    post_ride, get_ride_feed, build_ride_detail_response,
    create_ride_request, accept_ride_request,
    decline_ride_request, cancel_ride_request,
    complete_ride, start_ride, cancel_posted_ride,
)
from app.models.ride import Ride, RideStatus
from app.models.ride_request import RideRequest
from app.schemas.user import UserPublic
 
router = APIRouter(prefix="/rides", tags=["Rides"])
 
 
def _build_feed_item(ride: Ride, driver: User) -> RideFeedItem:
    """Helper — builds a RideFeedItem from an ORM Ride object."""
    return RideFeedItem(
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
        driver=UserPublic.model_validate(driver),
    )
 
 
# ─── POST /rides ──────────────────────────────────────────────────────────────
@router.post("", response_model=RideFeedItem, status_code=status.HTTP_201_CREATED)
def post_a_ride(
    payload: RideCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """
    Driver posts a ride.
    PROTOTYPE GATE: driver must have car details set (make + plate) before posting.
    This replaces the admin verification requirement for the prototype.
    """
    if not current_user.car_make or not current_user.car_plate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please add your car details (make, model, colour, plate) in your profile before posting a ride.",
        )
    ride = post_ride(db, current_user, payload)
    return _build_feed_item(ride, current_user)
 
 
# ─── GET /rides (feed) ───────────────────────────────────────────────────────
@router.get("", response_model=list[RideFeedItem])
def ride_feed(
    destination: Optional[str] = Query(None),
    route_keyword: Optional[str] = Query(None),
    max_cost: Optional[float] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns open rides. Car details never included in the feed."""
    filters = RideFeedFilter(
        destination=destination,
        route_keyword=route_keyword,
        max_cost=max_cost,
    )
    rides = get_ride_feed(db, filters, skip=skip, limit=limit)
    return [_build_feed_item(r, r.driver) for r in rides]
 
 
# ─── GET /rides/my/posted (driver) ───────────────────────────────────────────
# MUST come before /{ride_id} so FastAPI doesn't treat "my" as an id
@router.get("/my/posted", response_model=list[RideFeedItem])
def my_posted_rides(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Returns all rides posted by the current driver."""
    rides = (
        db.query(Ride)
        .filter(Ride.driver_id == current_user.id)
        .order_by(Ride.created_at.desc())
        .all()
    )
    return [_build_feed_item(r, current_user) for r in rides]
 
 
# ─── GET /rides/my/requests (rider) ──────────────────────────────────────────
@router.get("/my/requests", response_model=list[RideRequestResponse])
def my_ride_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all ride requests made by the current rider."""
    return (
        db.query(RideRequest)
        .filter(RideRequest.rider_id == current_user.id)
        .order_by(RideRequest.created_at.desc())
        .all()
    )
 
 
# ─── GET /rides/{id} ─────────────────────────────────────────────────────────
@router.get("/{ride_id}", response_model=RideDetailResponse)
def get_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns full ride detail.
    Car fields populated only if you are the driver OR have an accepted request.
    """
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found.")
    return build_ride_detail_response(ride, current_user, db)
 
 
# ─── POST /rides/{id}/requests (rider sends join request) ────────────────────
@router.post("/{ride_id}/requests", response_model=RideRequestResponse, status_code=status.HTTP_201_CREATED)
def request_to_join(
    ride_id: int,
    payload: RideRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider sends a join request. Creates a MessageThread automatically."""
    if current_user.role != "rider":
        raise HTTPException(status_code=403, detail="Only riders can request rides.")
    return create_ride_request(db, current_user, ride_id, payload.drop_off_note)
 
 
# ─── GET /rides/{id}/requests (driver sees all requests) ─────────────────────
@router.get("/{ride_id}/requests", response_model=list[RideRequestResponse])
def list_ride_requests(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Driver views all requests for one of their rides."""
    ride = db.query(Ride).filter(Ride.id == ride_id, Ride.driver_id == current_user.id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found or not yours.")
    return ride.requests
 
 
# ─── POST /rides/requests/{id}/accept (driver accepts) ───────────────────────
@router.post("/requests/{request_id}/accept", response_model=RideRequestResponse)
def accept_request(
    request_id: int,
    payload: RideRequestAccept,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Driver accepts a rider. Car details become visible to that rider."""
    return accept_ride_request(db, current_user, request_id, payload)
 
 
# ─── POST /rides/requests/{id}/decline (driver declines) ─────────────────────
@router.post("/requests/{request_id}/decline", response_model=RideRequestResponse)
def decline_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Driver declines a rider's request."""
    return decline_ride_request(db, current_user, request_id)
 
 
# ─── POST /rides/requests/{id}/cancel (rider cancels) ────────────────────────
@router.post("/requests/{request_id}/cancel", response_model=RideRequestResponse)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Rider withdraws their own request."""
    return cancel_ride_request(db, current_user, request_id)
 
 
# ─── POST /rides/{id}/start (driver starts ride) ─────────────────────────────
@router.post("/{ride_id}/start", response_model=RideFeedItem)
def start_a_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """
    Driver starts the ride — status moves from open/full → in_progress.
    Can be started even if not all seats are filled.
    """
    ride = start_ride(db, current_user, ride_id)
    return _build_feed_item(ride, current_user)
 
 
# ─── POST /rides/{id}/complete (driver ends ride) ────────────────────────────
@router.post("/{ride_id}/complete", response_model=dict)
def mark_ride_complete(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """Driver marks ride as completed. Riders can then rate the driver."""
    ride = complete_ride(db, current_user, ride_id)
    return {"message": "Ride marked as completed.", "ride_id": ride.id}
 
 
# ─── POST /rides/{id}/cancel (driver cancels posted ride) ────────────────────
@router.post("/{ride_id}/cancel", response_model=dict)
def cancel_a_ride(
    ride_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_driver),
):
    """
    Driver cancels a posted ride.
    All pending requests are automatically declined.
    """
    ride = cancel_posted_ride(db, current_user, ride_id)
    return {"message": "Ride cancelled.", "ride_id": ride.id}
