from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, Literal
from datetime import datetime
 
 
# ─── Role literal (no model import needed) ────────────────────────────────────
UserRoleLiteral = Literal["rider", "driver"]
 
 
# ─── Signup ──────────────────────────────────────────────────────────────────
 
class UserSignupRequest(BaseModel):
    full_name: str
    phone: str
    password: str
    role: UserRoleLiteral
    parish: Optional[str] = None
 
    @field_validator("phone")
    @classmethod
    def phone_must_be_valid(cls, v: str) -> str:
        digits = v.replace("+", "").replace(" ", "").replace("-", "")
        if not digits.isdigit() or len(digits) < 10:
            raise ValueError("Enter a valid Nigerian phone number")
        return v
 
    @field_validator("password")
    @classmethod
    def password_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v
 
 
# ─── Login ───────────────────────────────────────────────────────────────────
 
class LoginRequest(BaseModel):
    phone: str
    password: str
 
 
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic
 
 
# ─── Document upload ─────────────────────────────────────────────────────────
 
class DocumentUploadRequest(BaseModel):
    doc_type: str
    cloudinary_url: str
 
    @field_validator("doc_type")
    @classmethod
    def valid_doc_type(cls, v: str) -> str:
        allowed = {"selfie", "nin", "licence", "car_photo"}
        if v not in allowed:
            raise ValueError(f"doc_type must be one of {allowed}")
        return v
 
 
class DocumentUploadResponse(BaseModel):
    message: str
    doc_type: str
    url: str
 
 
# ─── Car details ─────────────────────────────────────────────────────────────
 
class CarDetailsRequest(BaseModel):
    car_make: str
    car_model: str
    car_year: int
    car_colour: str
    car_plate: str
 
 
# ─── Emergency contact ────────────────────────────────────────────────────────
 
class EmergencyContactRequest(BaseModel):
    name: str
    phone: str
 
 
# ─── Public user profile ──────────────────────────────────────────────────────
 
class UserPublic(BaseModel):
    id: int
    full_name: str
    phone: str
    role: str           # plain str — avoids importing UserRole enum from models
    parish: Optional[str]
    is_verified: bool
    phone_verified: bool
    selfie_url: Optional[str]
    average_rating: float
    total_ratings: int
    total_rides: int
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    created_at: datetime
 
    model_config = {"from_attributes": True}
 
 
# ─── Driver profile with car (only sent to accepted riders) ──────────────────
 
class DriverWithCarPublic(UserPublic):
    car_make: Optional[str]
    car_model: Optional[str]
    car_year: Optional[int]
    car_colour: Optional[str]
    car_plate: Optional[str]
    car_photo_url: Optional[str]
