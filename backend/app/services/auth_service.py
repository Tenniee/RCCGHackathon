from fastapi import HTTPException, status
from passlib.context import CryptContext
from sqlalchemy.orm import Session
 
from app.models.user import User, UserRole
from app.schemas.user import UserSignupRequest, LoginRequest, TokenResponse, UserPublic
from app.core.security import create_access_token
 
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
 
 
def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)
 
 
def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
 
 
def signup_user(db: Session, payload: UserSignupRequest) -> User:
    existing = db.query(User).filter(User.phone == payload.phone).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone number already exists.",
        )
 
    user = User(
        full_name=payload.full_name,
        phone=payload.phone,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        parish=payload.parish,
        is_verified=False,   # always starts unverified — admin must approve
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
 
 
def login_user(db: Session, payload: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.phone == payload.phone).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Contact support.",
        )
 
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserPublic.model_validate(user),
    )
