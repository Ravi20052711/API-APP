from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
import stripe
from datetime import datetime, timedelta
from app.config.database import get_db, get_payments_db
from app.models import SubscriptionPlan, Subscription, User, BillingInvoice
from app.models.payments import PaymentTransaction
from app.api.schemas import SubscriptionPlanCreate, SubscriptionPlanResponse
from app.middleware.auth import get_current_user
from app.config import settings

router = APIRouter(prefix="/billing", tags=["billing"])
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.get("/plans", response_model=List[SubscriptionPlanResponse])
def list_plans(db: Session = Depends(get_db)):
    plans = db.query(SubscriptionPlan).filter(SubscriptionPlan.is_active).all()
    return plans


@router.post("/plans", response_model=SubscriptionPlanResponse, status_code=status.HTTP_201_CREATED)
def create_plan(
    plan_data: SubscriptionPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only superusers can create plans")
    
    # Create Stripe Product and Price
    try:
        product = stripe.Product.create(
            name=plan_data.name,
            description=plan_data.description
        )
        price = stripe.Price.create(
            product=product.id,
            unit_amount=int(plan_data.price_monthly * 100),
            currency="inr",
            recurring={"interval": "month"},
        )
        
        plan = SubscriptionPlan(
            **plan_data.model_dump(exclude={"stripe_price_id"}),
            stripe_product_id=product.id,
            stripe_price_id=price.id
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/create-checkout-session/{plan_id}")
async def create_checkout_session(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    if not plan.stripe_price_id:
        raise HTTPException(status_code=400, detail="Plan not configured for Stripe")

    # Ensure user has a stripe customer id
    if not current_user.stripe_customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.full_name,
            metadata={"user_id": current_user.id}
        )
        current_user.stripe_customer_id = customer.id
        db.commit()

    try:
        checkout_session = stripe.checkout.Session.create(
            customer=current_user.stripe_customer_id,
            line_items=[{
                'price': plan.stripe_price_id,
                'quantity': 1,
            }],
            mode='subscription',
            success_url=f"{settings.FRONTEND_URL}/billing?success=true&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/billing?canceled=true",
            metadata={
                "user_id": current_user.id,
                "plan_id": plan.id
            }
        )
        return {"url": checkout_session.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle events
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = int(session['metadata']['user_id'])
        plan_id = int(session['metadata']['plan_id'])
        stripe_sub_id = session['subscription']
        
        # Cancel old active subscriptions
        db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == "active"
        ).update({"status": "cancelled", "cancelled_at": datetime.utcnow()})
        
        # Create new subscription
        new_sub = Subscription(
            user_id=user_id,
            plan_id=plan_id,
            stripe_subscription_id=stripe_sub_id,
            status="active",
            current_period_start=datetime.utcnow(),
            current_period_end=datetime.utcnow() + timedelta(days=30)
        )
        db.add(new_sub)
        db.commit()

        # TRIGGER WEBHOOK
        from app.utils.webhooks import trigger_webhook
        import asyncio
        asyncio.create_task(trigger_webhook(user_id, "subscription_created", {
            "plan_id": plan_id,
            "subscription_id": stripe_sub_id
        }))

    elif event['type'] == 'invoice.paid':
        invoice = event['data']['object']
        stripe_sub_id = invoice['subscription']
        
        sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == stripe_sub_id).first()
        if sub:
            sub.current_period_end = datetime.fromtimestamp(invoice['period_end'])
            db.commit()
            
            # Record in billing_invoices
            new_invoice = BillingInvoice(
                user_id=sub.user_id,
                subscription_id=sub.id,
                amount=invoice['amount_paid'] / 100,
                status="paid",
                stripe_invoice_id=invoice['id'],
                period_start=datetime.fromtimestamp(invoice['period_start']),
                period_end=datetime.fromtimestamp(invoice['period_end']),
                paid_at=datetime.utcnow()
            )
            db.add(new_invoice)
            db.commit()

            # TRIGGER WEBHOOK
            from app.utils.webhooks import trigger_webhook
            import asyncio
            asyncio.create_task(trigger_webhook(sub.user_id, "payment_succeeded", {
                "amount": invoice['amount_paid'] / 100,
                "invoice_id": invoice['id']
            }))

    elif event['type'] == 'customer.subscription.deleted':
        stripe_sub_id = event['data']['object']['id']
        db.query(Subscription).filter(
            Subscription.stripe_subscription_id == stripe_sub_id
        ).update({"status": "expired", "cancelled_at": datetime.utcnow()})
        db.commit()

        # TRIGGER WEBHOOK
        sub = db.query(Subscription).filter(Subscription.stripe_subscription_id == stripe_sub_id).first()
        if sub:
            from app.utils.webhooks import trigger_webhook
            import asyncio
            asyncio.create_task(trigger_webhook(sub.user_id, "subscription_expired", {
                "subscription_id": stripe_sub_id
            }))

    return {"status": "success"}


@router.post("/subscribe/{plan_id}")
def subscribe_to_plan(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(SubscriptionPlan).filter(SubscriptionPlan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Cancel existing subscription if any
    db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active"
    ).update({"status": "cancelled", "cancelled_at": datetime.utcnow()})

    # Create new subscription
    new_sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        status="active",
        current_period_start=datetime.utcnow(),
        current_period_end=datetime.utcnow() + timedelta(days=30),
        stripe_subscription_id=f"upi_mock_{current_user.id}_{int(datetime.utcnow().timestamp())}"
    )
    
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)
    
    return {
        "message": "Successfully subscribed via UPI gateway",
        "subscription": new_sub
    }


@router.get("/subscription")
def get_current_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subscription = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == "active"
    ).first()
    
    if not subscription:
        return {"subscription": None}
    
    return {
        "subscription": subscription,
        "plan": subscription.plan
    }
