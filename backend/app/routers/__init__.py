
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.rides import router as rides_router
from app.routers.messages import router as messages_router
from app.routers.emergency import router as emergency_router

__all__ = [
    "auth_router",
    "users_router",
    "rides_router",
    "messages_router",
    "emergency_router",
]