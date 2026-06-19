from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, DateTime, Float,
    Boolean, ForeignKey, Text, CheckConstraint
)
from sqlalchemy.orm import relationship
 
from app.core.database import Base
 
 
class EmergencyAlert(Base):
    """
    Created when a rider double-taps the SOS button during an active ride.
    Stored in the DB so admins can review safety incidents.
    The trusted contact receives an in-app notification (no SMS in prototype).
    Live location — added later via Google Maps SDK.
    """
    __tablename__ = "emergency_alerts"
 
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    ride_request_id = Column(Integer, ForeignKey("ride_requests.id"), nullable=True)
 
    # Snapshot of ride info at alert time
    ride_snapshot = Column(Text, nullable=True)   # JSON string: driver name, car, route
    trusted_contact_phone = Column(String(20), nullable=True)
    trusted_contact_name = Column(String(120), nullable=True)
 
    # Resolved by user or admin
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_note = Column(Text, nullable=True)
 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    resolved_at = Column(DateTime, nullable=True)
 
    # ── Relationships ─────────────────────────────────────────────────────────
    user = relationship("User", back_populates="emergency_alerts")
 
 
class Rating(Base):
    """
    Post-ride rating. Both rider → driver and driver → rider ratings are stored.
    Average is computed and cached on the User row after each new rating.
    """
    __tablename__ = "ratings"
 
    id = Column(Integer, primary_key=True, index=True)
    rater_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ratee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_request_id = Column(Integer, ForeignKey("ride_requests.id"), nullable=False)
 
    score = Column(Float, nullable=False)   # 1.0 – 5.0
    comment = Column(Text, nullable=True)
    tags = Column(String(300), nullable=True)   # comma-separated: "Punctual,Safe driver"
 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
 
    __table_args__ = (
        CheckConstraint("score >= 1.0 AND score <= 5.0", name="rating_score_range"),
    )
 
    # ── Relationships ─────────────────────────────────────────────────────────
    rater = relationship("User", back_populates="ratings_given", foreign_keys=[rater_id])
    ratee = relationship("User", back_populates="ratings_received", foreign_keys=[ratee_id])
 