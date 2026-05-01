from app.celery_app import celery_app
from app.config.database import SessionLocal
from app.models import Subscription, UsageLog, BillingInvoice
from datetime import datetime, timedelta
from sqlalchemy import func

@celery_app.task(name="app.tasks.calculate_usage_and_billing")
def calculate_usage_and_billing():
    db = SessionLocal()
    try:
        # Get all active subscriptions
        active_subs = db.query(Subscription).filter(Subscription.status == "active").all()
        
        for sub in active_subs:
            # Calculate usage for the current period
            usage_count = db.query(func.count(UsageLog.id)).filter(
                UsageLog.user_id == sub.user_id,
                UsageLog.timestamp >= sub.current_period_start,
                UsageLog.timestamp <= datetime.utcnow()
            ).scalar()
            
            plan = sub.plan
            overage = max(0, usage_count - plan.included_requests)
            overage_charge = overage * plan.overage_rate_per_request
            
            # Check if we should generate an interim invoice or just log it
            # For simplicity, we'll just update or create a pending invoice
            invoice = db.query(BillingInvoice).filter(
                BillingInvoice.subscription_id == sub.id,
                BillingInvoice.status == "pending"
            ).first()
            
            if not invoice:
                invoice = BillingInvoice(
                    user_id=sub.user_id,
                    subscription_id=sub.id,
                    amount=overage_charge,
                    usage_count=usage_count,
                    overage_charges=overage_charge,
                    period_start=sub.current_period_start,
                    period_end=sub.current_period_end
                )
                db.add(invoice)
            else:
                invoice.amount = overage_charge
                invoice.usage_count = usage_count
                invoice.overage_charges = overage_charge
            
            db.commit()
            
    finally:
        db.close()
    
    return "Billing calculation completed"
