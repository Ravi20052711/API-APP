from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
from app.config.database import get_db
from app.models import Webhook, User
from app.api.schemas import WebhookCreate, WebhookResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.get("/", response_model=List[WebhookResponse])
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Webhook).filter(Webhook.user_id == current_user.id).all()


@router.post("/", response_model=WebhookResponse, status_code=status.HTTP_201_CREATED)
def create_webhook(
    webhook_data: WebhookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    webhook = Webhook(
        **webhook_data.model_dump(),
        user_id=current_user.id,
        secret=f"whsec_{secrets.token_hex(16)}"
    )
    db.add(webhook)
    db.commit()
    db.refresh(webhook)
    return webhook


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webhook(
    webhook_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    webhook = db.query(Webhook).filter(
        Webhook.id == webhook_id,
        Webhook.user_id == current_user.id
    ).first()
    
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    
    db.delete(webhook)
    db.commit()
