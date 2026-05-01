from app.config.database import Base, engine

Base.metadata.create_all(bind=engine)

from app.models import SubscriptionPlan

from sqlalchemy.orm import Session
from app.config.database import SessionLocal

db = SessionLocal()

try:
    # Clear existing plans to avoid duplicates or stale data
    db.query(SubscriptionPlan).delete()
    
    plans = [
        SubscriptionPlan(
            name="Free",
            description="Perfect for testing and small personal projects.",
            price_monthly=0.0,
            price_yearly=0.0,
            rate_limit_per_minute=5,
            rate_limit_per_day=100,
            included_requests=100,
            overage_rate_per_request=0.0,
            features="Standard Free Access"
        ),
        SubscriptionPlan(
            name="Pro Plan",
            description="High-performance access for growing businesses.",
            price_monthly=20000.0,
            price_yearly=200000.0,
            rate_limit_per_minute=500,
            rate_limit_per_day=100000,
            included_requests=1000000,
            overage_rate_per_request=0.01,
            features="Full Marketplace Access, Priority Support, 500 req/min"
        ),
        SubscriptionPlan(
            name="Max Plan",
            description="Unlimited scale for enterprise applications.",
            price_monthly=30000.0,
            price_yearly=300000.0,
            rate_limit_per_minute=2000,
            rate_limit_per_day=500000,
            included_requests=5000000,
            overage_rate_per_request=0.005,
            features="Ultra-Low Latency, Dedicated Account Manager, 2000 req/min"
        )
    ]
    
    for plan in plans:
        db.add(plan)
    
    db.commit()
    print("Marketplace subscription plans created successfully!")
    
except Exception as e:
    db.rollback()
    print(f"Error seeding plans: {e}")
finally:
    db.close()
