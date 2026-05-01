from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./meterflow.db"
    PAYMENTS_DATABASE_URL: str = "sqlite:///./payments.db"
    REDIS_URL: str = "redis://localhost:6379"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    FRONTEND_URL: str = "http://localhost:5173"
    
    class Config:
        env_file = ".env"


settings = Settings()
