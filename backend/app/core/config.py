from pydantic_settings import BaseSettings
from functools import lru_cache
 
 
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/rccg_ride_connect"
 
    # JWT
    SECRET_KEY: str = "dev-secret-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 days
 
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""
 
    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000, https://rccg-hackathon-coral.vercel.app/signup"
 
    # OTP optional module
    OTP_ENABLED: bool = False
    TERMII_API_KEY: str = ""
    TERMII_SENDER_ID: str = "RCCGRide"
 
    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]
 
    class Config:
        env_file = ".env"
        extra = "ignore"
 
 
@lru_cache()
def get_settings() -> Settings:
    return Settings()
