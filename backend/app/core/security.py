from datetime import datetime, timedelta, timezone
from typing import Optional
 
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.orm import Session
 
from app.core.config import get_settings
from app.core.database import get_db
 
settings = get_settings()
 
http_bearer = HTTPBearer(auto_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)
 
 
# ─── Token creation ───────────────────────────────────────────────────────────
 
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
 
 
# ─── Token extraction ─────────────────────────────────────────────────────────
 
def _extract_token(
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(http_bearer),
) -> str:
    if bearer is None or not bearer.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated — include Authorization: Bearer <token> header",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return bearer.credentials
 
 
# ─── Current user ─────────────────────────────────────────────────────────────
 
def get_current_user(
    token: str = Depends(_extract_token),
    db: Session = Depends(get_db),
):
    from app.models.user import User
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
 
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user
 
 
# ─── PROTOTYPE: verification skipped ─────────────────────────────────────────
# In production, restore the is_verified check:
#   if not current_user.is_verified: raise HTTPException(403, "Pending verification")
 
def get_current_verified_user(current_user=Depends(get_current_user)):
    # Prototype — all logged-in users treated as verified
    return current_user
 
 
def get_current_driver(current_user=Depends(get_current_user)):
    # Prototype — only role check, no verification check
    # In production add: if not current_user.is_verified: raise 403
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can perform this action.",
        )
    return current_user
