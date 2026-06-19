"""
RCCG Ride Connect — FastAPI Backend
Run with:  uvicorn app.main:app --reload --port 8000
"""
 
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.core.config import get_settings
from app.core.database import engine, Base
 
# ── 1. Import models FIRST so all tables are registered before anything else ──
import app.models  # noqa: F401
 
# ── 2. Import routers AFTER models are fully loaded ───────────────────────────
from app.routers import (
    auth_router,
    users_router,
    rides_router,
    messages_router,
    emergency_router,
)
 
settings = get_settings()
 
app = FastAPI(
    title="RCCG Ride Connect API",
    description="Backend for the RCCG community ride-sharing app.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
 
# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# ── Create tables on startup (safe for Neon dev; use Alembic in production) ───
@app.on_event("startup")
def create_tables():
    Base.metadata.create_all(bind=engine)
 
# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(rides_router)
app.include_router(messages_router)
app.include_router(emergency_router)
 
# ── Optional OTP module ───────────────────────────────────────────────────────
# Uncomment both lines below to enable, set OTP_ENABLED=true in .env
# from app.otp_module.otp_router import router as otp_router
# app.include_router(otp_router)
 
# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok", "app": "RCCG Ride Connect", "version": "1.0.0"}
 
@app.get("/", tags=["Health"])
def root():
    return {"message": "RCCG Ride Connect API 🚗🙏", "docs": "/docs"}
 