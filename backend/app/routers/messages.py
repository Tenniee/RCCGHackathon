
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_verified_user
from app.models.user import User
from app.schemas.rides_etc import MessageCreate, MessageResponse, ThreadResponse
from app.services.message_service import (
    get_thread, send_message, list_my_threads, unread_count,
)

router = APIRouter(prefix="/messages", tags=["Messages"])


@router.get("/threads", response_model=list[ThreadResponse])
def get_my_threads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """
    Returns all message threads the current user is part of.
    Each thread is one (driver, rider, ride) conversation.
    Ordered newest first for the inbox view.
    """
    return list_my_threads(db, current_user)


@router.get("/threads/{thread_id}", response_model=ThreadResponse)
def get_thread_detail(
    thread_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """
    Returns a thread and all its messages.
    Marks all incoming (unread) messages as read.
    Only the driver and rider of that thread can access it.
    """
    return get_thread(db, thread_id, current_user)


@router.post("/send", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def send(
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """
    Sends a message in an existing thread.
    Both the driver and rider profile photos (selfie_url) are included
    in the sender field so the frontend can show them as chat avatars.
    """
    return send_message(db, current_user, payload)


@router.get("/unread-count", response_model=dict)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_verified_user),
):
    """
    Returns total unread message count across all threads.
    Used to drive the notification badge on the Messages tab.
    """
    count = unread_count(db, current_user)
    return {"unread": count}
