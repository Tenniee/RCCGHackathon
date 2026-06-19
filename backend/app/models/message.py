from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
 
from app.core.database import Base
 
 
class MessageThread(Base):
    """
    One thread per (driver, rider, ride) trio.
    Created automatically when a rider sends a request.
    """
    __tablename__ = "message_threads"
 
    id = Column(Integer, primary_key=True, index=True)
    driver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rider_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    ride_id   = Column(Integer, ForeignKey("rides.id"), nullable=False)
 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
 
    # ── Relationships — all string refs so load order doesn't matter ──────────
    driver   = relationship("User",        foreign_keys="[MessageThread.driver_id]")
    rider    = relationship("User",        foreign_keys="[MessageThread.rider_id]")
    ride     = relationship("Ride")
    messages = relationship("Message",     back_populates="thread", order_by="Message.created_at")
 
    # RideRequest is defined AFTER MessageThread, so use string + brackets
    ride_request = relationship(
        "RideRequest",
        back_populates="thread",
        foreign_keys="[RideRequest.thread_id]",
        uselist=False,
    )
 
 
class Message(Base):
    __tablename__ = "messages"
 
    id        = Column(Integer, primary_key=True, index=True)
    thread_id = Column(Integer, ForeignKey("message_threads.id"), nullable=False, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
 
    body    = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
 
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
 
    # ── Relationships ─────────────────────────────────────────────────────────
    thread = relationship("MessageThread", back_populates="messages")
    sender = relationship("User",          back_populates="sent_messages", foreign_keys="[Message.sender_id]")
