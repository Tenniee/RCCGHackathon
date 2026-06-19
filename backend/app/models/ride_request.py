from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class RequestStatus(str, enum.Enum):
    pending = "pending"       # rider sent request, driver hasn't responded
    accepted = "accepted"     # driver accepted — car details now unlocked
    declined = "declined"     # driver declined
    cancelled = "cancelled"   # rider withdrew request


class RideRequest(Base):
    __tablename__ = "ride_requests"

    id = Column(Integer, primary_key=True, index=True)
    ride_id = Column(Integer, ForeignKey("rides.id"), nullable=False, index=True)
    rider_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Rider's stated drop-off (can differ from ride destination)
    drop_off_note = Column(String(200), nullable=True)

    status = Column(SAEnum(RequestStatus), default=RequestStatus.pending, nullable=False, index=True)

    # Set by driver on acceptance — the agreed meetup point
    meetup_point = Column(String(200), nullable=True)

    # Conversation thread id — FK string avoids circular import with message.py
    thread_id = Column(Integer, ForeignKey("message_threads.id"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # ── Relationships — string refs so SQLAlchemy resolves lazily ─────────────
    ride   = relationship("Ride",          back_populates="requests")
    rider  = relationship("User",          back_populates="ride_requests",  foreign_keys="[RideRequest.rider_id]")
    thread = relationship("MessageThread", back_populates="ride_request",   foreign_keys="[RideRequest.thread_id]")