from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

PaymentBase = declarative_base()

class PaymentTransaction(PaymentBase):
    __tablename__ = "payment_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(String(50), default="completed")
    item_type = Column(String(50)) # "subscription" or "api_key"
    item_id = Column(Integer)
    transaction_id = Column(String(255), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
