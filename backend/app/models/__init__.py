from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.config.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Payment support
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    
    api_keys = relationship("APIKey", back_populates="user", cascade="all, delete-orphan")
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="user", cascade="all, delete-orphan")


class APIKey(Base):
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    category = Column(String(100), default="General") # AI, Backend, Automation, Database
    is_active = Column(Boolean, default=True)
    is_paid = Column(Boolean, default=False)
    price = Column(Float, default=0.0)
    upstream_url = Column(String(500), nullable=True) # The real API endpoint
    upstream_key = Column(String(500), nullable=True) # The real secret key
    rate_limit_per_minute = Column(Integer, default=60)
    rate_limit_per_day = Column(Integer, default=10000)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    last_used_at = Column(DateTime, nullable=True)
    
    # Rotation support
    previous_key = Column(String(255), nullable=True)
    previous_key_expires_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="api_keys")
    usage_logs = relationship("UsageLog", back_populates="api_key", cascade="all, delete-orphan")


class UsageLog(Base):
    __tablename__ = "usage_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    endpoint = Column(String(500), nullable=False)
    method = Column(String(10), nullable=False)
    status_code = Column(Integer)
    response_time_ms = Column(Float)
    request_size = Column(Integer)
    response_size = Column(Integer)
    ip_address = Column(String(45))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    error_message = Column(Text, nullable=True)
    
    user = relationship("User", back_populates="usage_logs")
    api_key = relationship("APIKey", back_populates="usage_logs")


class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price_monthly = Column(Float, nullable=False)
    price_yearly = Column(Float)
    rate_limit_per_minute = Column(Integer)
    rate_limit_per_day = Column(Integer)
    included_requests = Column(Integer, default=1000)
    overage_rate_per_request = Column(Float, default=0.001)
    features = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Stripe support
    stripe_product_id = Column(String(255), unique=True, nullable=True)
    stripe_price_id = Column(String(255), unique=True, nullable=True)


class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    plan_id = Column(Integer, ForeignKey("subscription_plans.id"), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
    status = Column(String(50), default="active")
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="subscriptions")
    plan = relationship("SubscriptionPlan")


class BillingInvoice(Base):
    __tablename__ = "billing_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subscription_id = Column(Integer, ForeignKey("subscriptions.id"))
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="pending")
    stripe_invoice_id = Column(String(255), unique=True, nullable=True)
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    usage_count = Column(Integer, default=0)
    overage_charges = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)


class Webhook(Base):
    __tablename__ = "webhooks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    url = Column(String(500), nullable=False)
    events = Column(String(500), default="*") # comma separated events
    is_active = Column(Boolean, default=True)
    secret = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User")


class WebhookLog(Base):
    __tablename__ = "webhook_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    webhook_id = Column(Integer, ForeignKey("webhooks.id"), nullable=False)
    event = Column(String(100), nullable=False)
    payload = Column(Text)
    status_code = Column(Integer)
    response_body = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, default=False)

