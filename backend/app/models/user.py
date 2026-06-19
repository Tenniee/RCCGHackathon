from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Enum as SAEnum, Text, Float
)
from sqlalchemy.orm import relationship
import enum
 
from app.core.database import Base
 
 
class UserRole(str, enum.Enum):
    rider = "rider"
    driver = "driver"
 
 
class User(Base):
    __tablename__ = "users"
 
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), nullable=False)
    parish = Column(String(200), nullable=True)
 
    # ── Verification status ──────────────────────────────────────────────────
    # Admin flips is_verified=True after manually checking documents.
    # Until then, the user cannot post rides or send requests.
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
 
    # ── Cloudinary document URLs ─────────────────────────────────────────────
    # Frontend uploads directly to Cloudinary, then POSTs the secure_url here.
    selfie_url = Column(String(500), nullable=True)       # photo or short video
    nin_url = Column(String(500), nullable=True)          # NIN slip / card scan
 
    # Driver-only documents
    licence_url = Column(String(500), nullable=True)      # driver's licence photo
    car_photo_url = Column(String(500), nullable=True)    # exterior car photo
 
    # ── Car details (hidden from riders until ride accepted) ─────────────────
    car_make = Column(String(80), nullable=True)
    car_model = Column(String(80), nullable=True)
    car_year = Column(Integer, nullable=True)
    car_colour = Column(String(40), nullable=True)
    car_plate = Column(String(20), nullable=True)
 
    # ── Trust score ──────────────────────────────────────────────────────────
    average_rating = Column(Float, default=0.0, nullable=False)
    total_ratings = Column(Integer, default=0, nullable=False)
    total_rides = Column(Integer, default=0, nullable=False)
 
    # ── Emergency contact ────────────────────────────────────────────────────
    emergency_contact_name = Column(String(120), nullable=True)
    emergency_contact_phone = Column(String(20), nullable=True)
 
    # ── Phone verification (optional OTP module) ─────────────────────────────
    phone_verified = Column(Boolean, default=False, nullable=False)
 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
 
    # ── Relationships ─────────────────────────────────────────────────────────
    rides_posted = relationship("Ride", back_populates="driver", foreign_keys="Ride.driver_id")
    ride_requests = relationship("RideRequest", back_populates="rider", foreign_keys="RideRequest.rider_id")
    sent_messages = relationship("Message", back_populates="sender", foreign_keys="Message.sender_id")
    emergency_alerts = relationship("EmergencyAlert", back_populates="user")
    ratings_given = relationship("Rating", back_populates="rater", foreign_keys="Rating.rater_id")
    ratings_received = relationship("Rating", back_populates="ratee", foreign_keys="Rating.ratee_id")
 
