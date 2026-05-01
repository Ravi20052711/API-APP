import httpx
import hmac
import hashlib
import json
from app.models import Webhook, WebhookLog
from app.config.database import SessionLocal
from datetime import datetime

async def trigger_webhook(user_id: int, event: str, payload: dict):
    db = SessionLocal()
    try:
        webhooks = db.query(Webhook).filter(
            Webhook.user_id == user_id,
            Webhook.is_active == True
        ).all()
        
        for webhook in webhooks:
            # Check if event matches
            if webhook.events != "*" and event not in webhook.events.split(","):
                continue
            
            payload_json = json.dumps(payload)
            signature = hmac.new(
                webhook.secret.encode(),
                payload_json.encode(),
                hashlib.sha256
            ).hexdigest()
            
            headers = {
                "Content-Type": "application/json",
                "X-MeterFlow-Event": event,
                "X-MeterFlow-Signature": signature
            }
            
            async with httpx.AsyncClient() as client:
                try:
                    response = await client.post(
                        webhook.url,
                        content=payload_json,
                        headers=headers,
                        timeout=10.0
                    )
                    
                    log = WebhookLog(
                        webhook_id=webhook.id,
                        event=event,
                        payload=payload_json,
                        status_code=response.status_code,
                        response_body=response.text[:1000],
                        success=200 <= response.status_code < 300
                    )
                    db.add(log)
                    db.commit()
                except Exception as e:
                    log = WebhookLog(
                        webhook_id=webhook.id,
                        event=event,
                        payload=payload_json,
                        status_code=0,
                        response_body=str(e),
                        success=False
                    )
                    db.add(log)
                    db.commit()
    finally:
        db.close()
