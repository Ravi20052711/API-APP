from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models import User
from app.utils import get_password_hash, create_access_token, verify_password
from app.api.schemas import UserCreate, UserResponse, Token, LoginRequest
from datetime import datetime, timedelta
from app.config import settings
from app.middleware.auth import get_current_user

import stripe
from app.models import User, Subscription, SubscriptionPlan

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create Stripe Customer
    stripe_customer_id = None
    if settings.STRIPE_SECRET_KEY:
        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            customer = stripe.Customer.create(
                email=user_data.email,
                name=user_data.full_name
            )
            stripe_customer_id = customer.id
        except Exception as e:
            print(f"Failed to create stripe customer: {e}")

    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=get_password_hash(user_data.password),
        stripe_customer_id=stripe_customer_id
    )
    
    db.add(user)
    db.commit()
    db.refresh(user)

    # Assign Free plan by default
    free_plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.name == "Free").first()
    if free_plan:
        subscription = Subscription(
            user_id=user.id,
            plan_id=free_plan.id,
            status="active"
        )
        db.add(subscription)
        db.commit()
    
    return user


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    return current_user
