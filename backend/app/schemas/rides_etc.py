from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from app.schemas.user import UserPublic
 
 
# ─── Ride request ─────────────────────────────────────────────────────────────
 
class RideRequestCreate(BaseModel):
    ride_id: int
    drop_off_note: Optional[str] = None
 
 
class RideRequestResponse(BaseModel):
    id: int
    ride_id: int
    status: str          # plain str — avoids importing RequestStatus from models
    drop_off_note: Optional[str]
    meetup_point: Optional[str]
    thread_id: Optional[int]
    created_at: datetime
    rider: UserPublic
 
    model_config = {"from_attributes": True}
 
 
class RideRequestAccept(BaseModel):
    meetup_point: Optional[str] = None
 
 
# ─── Messages ─────────────────────────────────────────────────────────────────
 
class MessageCreate(BaseModel):
    thread_id: int
    body: str
 
    @field_validator("body")
    @classmethod
    def body_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Message body cannot be empty")
        return v.strip()
 
 
class MessageResponse(BaseModel):
    id: int
    thread_id: int
    sender_id: int
    body: str
    is_read: bool
    created_at: datetime
    sender: UserPublic
 
    model_config = {"from_attributes": True}
 
 
class ThreadResponse(BaseModel):
    id: int
    ride_id: int
    driver: UserPublic
    rider: UserPublic
    messages: List[MessageResponse]
    created_at: datetime
 
    model_config = {"from_attributes": True}
 
 
# ─── Emergency alert ──────────────────────────────────────────────────────────
 
class EmergencyAlertCreate(BaseModel):
    ride_request_id: Optional[int] = None
    ride_snapshot: Optional[str] = None
 
 
class EmergencyAlertResponse(BaseModel):
    id: int
    user_id: int
    ride_request_id: Optional[int]
    trusted_contact_name: Optional[str]
    trusted_contact_phone: Optional[str]
    resolved: bool
    created_at: datetime
 
    model_config = {"from_attributes": True}
 
 
# ─── Rating ───────────────────────────────────────────────────────────────────
 
class RatingCreate(BaseModel):
    ride_request_id: int
    ratee_id: int
    score: float
    comment: Optional[str] = None
    tags: Optional[str] = None
 
    @field_validator("score")
    @classmethod
    def score_range(cls, v: float) -> float:
        if not (1.0 <= v <= 5.0):
            raise ValueError("Score must be between 1.0 and 5.0")
        return v
 
 
class RatingResponse(BaseModel):
    id: int
    rater_id: int
    ratee_id: int
    ride_request_id: int
    score: float
    comment: Optional[str]
    tags: Optional[str]
    created_at: datetime
 
    model_config = {"from_attributes": True}
