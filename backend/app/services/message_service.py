from fastapi import HTTPException, status
from sqlalchemy.orm import Session
 
from app.models.message import MessageThread, Message
from app.models.user import User
from app.schemas.rides_etc import MessageCreate
 
 
def get_thread(db: Session, thread_id: int, user: User) -> MessageThread:
    """
    Returns a thread only if the current user is the driver or rider on it.
    Marks all messages from the other party as read.
    """
    thread = db.query(MessageThread).filter(MessageThread.id == thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
 
    if user.id not in (thread.driver_id, thread.rider_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not part of this conversation.",
        )
 
    # Mark incoming messages as read
    db.query(Message).filter(
        Message.thread_id == thread_id,
        Message.sender_id != user.id,
        Message.is_read == False,
    ).update({"is_read": True})
    db.commit()
    db.refresh(thread)
    return thread
 
 
def send_message(db: Session, sender: User, payload: MessageCreate) -> Message:
    thread = db.query(MessageThread).filter(MessageThread.id == payload.thread_id).first()
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found.")
 
    if sender.id not in (thread.driver_id, thread.rider_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not part of this conversation.",
        )
 
    msg = Message(
        thread_id=payload.thread_id,
        sender_id=sender.id,
        body=payload.body,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
 
 
def list_my_threads(db: Session, user: User) -> list[MessageThread]:
    """Returns all threads the user is part of, newest first."""
    return (
        db.query(MessageThread)
        .filter(
            (MessageThread.driver_id == user.id) | (MessageThread.rider_id == user.id)
        )
        .order_by(MessageThread.id.desc())
        .all()
    )
 
 
def unread_count(db: Session, user: User) -> int:
    """Total unread messages across all threads for notification badge."""
    threads = list_my_threads(db, user)
    thread_ids = [t.id for t in threads]
    if not thread_ids:
        return 0
    return (
        db.query(Message)
        .filter(
            Message.thread_id.in_(thread_ids),
            Message.sender_id != user.id,
            Message.is_read == False,
        )
        .count()
    )
