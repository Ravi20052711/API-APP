from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    is_active: bool
    is_superuser: bool
    last_login_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class APIKeyCreate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = "General"
    upstream_url: Optional[str] = None
    upstream_key: Optional[str] = None
    rate_limit_per_minute: Optional[int] = 60
    rate_limit_per_day: Optional[int] = 10000
    is_paid: Optional[bool] = False
    price: Optional[float] = 0.0
    expires_at: Optional[datetime] = None


class APIKeyResponse(BaseModel):
    id: int
    key: str
    name: Optional[str]
    category: str = "General"
    upstream_url: Optional[str] = None
    user_id: Optional[int] = None
    is_active: bool
    is_paid: bool
    price: float
    rate_limit_per_minute: int
    rate_limit_per_day: int
    created_at: datetime
    expires_at: Optional[datetime]
    last_used_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class UsageLogResponse(BaseModel):
    id: int
    endpoint: str
    method: str
    status_code: Optional[int]
    response_time_ms: Optional[float]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class SubscriptionPlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price_monthly: float
    price_yearly: Optional[float] = None
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_day: Optional[int] = None
    included_requests: Optional[int] = 1000
    overage_rate_per_request: Optional[float] = 0.001
    stripe_price_id: Optional[str] = None


class SubscriptionPlanResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    price_monthly: float
    price_yearly: Optional[float]
    rate_limit_per_minute: Optional[int] = None
    rate_limit_per_day: Optional[int] = None
    included_requests: int
    overage_rate_per_request: float
    stripe_price_id: Optional[str] = None
    
    class Config:
        from_attributes = True


class WebhookCreate(BaseModel):
    url: str
    events: Optional[str] = "*"


class WebhookResponse(BaseModel):
    id: int
    url: str
    events: str
    is_active: bool
    secret: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

