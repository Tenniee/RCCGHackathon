from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Enum as SAEnum, Text, Float, ForeignKey
)
from sqlalchemy.orm import relationship
import enum
 
from app.core.database import Base
 
 
class RideStatus(str, enum.Enum):
    open = "open"           # accepting requests
    full = "full"           # no seats left
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"
 
 
class Ride(Base):
    __tablename__ = "rides"
 
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
 
    # ── Route information ────────────────────────────────────────────────────
    origin = Column(String(200), nullable=False)          # usually RCCG Camp
    destination = Column(String(200), nullable=False)
    route_description = Column(Text, nullable=True)       # "Passing Ojodu, Berger..."
    departure_time = Column(String(50), nullable=False)   # "~1:00 PM" (freetext for prototype)
 
    # ── Capacity ─────────────────────────────────────────────────────────────
    total_seats = Column(Integer, nullable=False, default=3)
    seats_taken = Column(Integer, nullable=False, default=0)
 
    # ── Cost ─────────────────────────────────────────────────────────────────
    cost_per_rider = Column(Float, nullable=False, default=0.0)  # 0 = free
 
    # ── Driver note ──────────────────────────────────────────────────────────
    driver_note = Column(Text, nullable=True)
 
    # ── Status ───────────────────────────────────────────────────────────────
    status = Column(SAEnum(RideStatus), default=RideStatus.open, nullable=False, index=True)
 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
 
    # ── Relationships ─────────────────────────────────────────────────────────
    driver = relationship("User", back_populates="rides_posted", foreign_keys=[driver_id])
    requests = relationship("RideRequest", back_populates="ride", cascade="all, delete-orphan")
 
    @property
    def seats_available(self) -> int:
        return self.total_seats - self.seats_taken
 
    @property
    def is_full(self) -> bool:
        return self.seats_taken >= self.total_seats
