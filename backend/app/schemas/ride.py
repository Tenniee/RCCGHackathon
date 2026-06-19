from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from app.schemas.user import UserPublic
 
 
# ─── Post a ride ─────────────────────────────────────────────────────────────
 
class RideCreateRequest(BaseModel):
    origin: str
    destination: str
    route_description: Optional[str] = None
    departure_time: str
    total_seats: int
    cost_per_rider: float = 0.0
    driver_note: Optional[str] = None
 
    @field_validator("total_seats")
    @classmethod
    def seats_must_be_positive(cls, v: int) -> int:
        if v < 1 or v > 8:
            raise ValueError("Seats must be between 1 and 8")
        return v
 
    @field_validator("cost_per_rider")
    @classmethod
    def cost_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Cost cannot be negative")
        return v
 
 
# ─── Feed item (no car details) ──────────────────────────────────────────────
 
class RideFeedItem(BaseModel):
    """Returned in the public ride feed. Car details are NOT included."""
    id: int
    origin: str
    destination: str
    route_description: Optional[str]
    departure_time: str
    total_seats: int
    seats_taken: int
    seats_available: int
    cost_per_rider: float
    driver_note: Optional[str]
    status: str          # plain str — avoids importing RideStatus enum from models
    created_at: datetime
    driver: UserPublic
 
    model_config = {"from_attributes": True}
 
 
# ─── Full ride detail (car revealed only to accepted riders) ─────────────────
 
class RideDetailResponse(RideFeedItem):
    car_make: Optional[str] = None
    car_model: Optional[str] = None
    car_year: Optional[int] = None
    car_colour: Optional[str] = None
    car_plate: Optional[str] = None
    car_photo_url: Optional[str] = None
 
 
# ─── Ride feed filter params ──────────────────────────────────────────────────
 
class RideFeedFilter(BaseModel):
    destination: Optional[str] = None
    route_keyword: Optional[str] = None
    max_cost: Optional[float] = None
    driver_gender: Optional[str] = None
