from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import redis
import time
from app.models import APIKey, UsageLog, Subscription
from app.config.database import SessionLocal
from datetime import datetime

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, redis_client: redis.Redis):
        super().__init__(app)
        self.redis_client = redis_client
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for auth and docs
        if request.url.path.startswith("/api/v1/auth") or \
           request.url.path.startswith("/docs") or \
           request.url.path.startswith("/redoc") or \
           request.url.path == "/" or \
           request.url.path == "/health":
            return await call_next(request)

        api_key = request.headers.get("X-API-Key")
        db = SessionLocal()
        
        try:
            api_key_obj = None
            if api_key:
                # Check both current and previous keys
                api_key_obj = db.query(APIKey).filter(
                    ((APIKey.key == api_key) | (APIKey.previous_key == api_key)),
                    APIKey.is_active == True
                ).first()
            
            if api_key and not api_key_obj:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Invalid or inactive API key"}
                )
            
            if api_key_obj:
                # Check if it's the previous key and if it has expired
                if api_key_obj.previous_key == api_key:
                    if not api_key_obj.previous_key_expires_at or api_key_obj.previous_key_expires_at < datetime.utcnow():
                        return JSONResponse(
                            status_code=403,
                            content={"detail": "This rotated API key has expired. Please use the new one."}
                        )

                # Check expiration of the main key (if it's the current key)
                elif api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "API key has expired"}
                    )

                current_minute = int(time.time() // 60)
                current_day = int(time.time() // 86400)
                
                minute_key = f"ratelimit:{api_key}:minute:{current_minute}"
                day_key = f"ratelimit:{api_key}:day:{current_day}"
                
                minute_count = self.redis_client.get(minute_key)
                day_count = self.redis_client.get(day_key)
                
                limit_min = api_key_obj.rate_limit_per_minute
                limit_day = api_key_obj.rate_limit_per_day
                
                if minute_count and int(minute_count) >= limit_min:
                    # TRIGGER WEBHOOK FOR RATE LIMIT REACHED
                    from app.utils.webhooks import trigger_webhook
                    import asyncio
                    asyncio.create_task(trigger_webhook(api_key_obj.user_id, "rate_limit_reached", {
                        "api_key_name": api_key_obj.name,
                        "limit": "minute",
                        "value": limit_min
                    }))
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Rate limit exceeded (per minute)"}
                    )
                
                if day_count and int(day_count) >= limit_day:
                    # TRIGGER WEBHOOK FOR RATE LIMIT REACHED
                    from app.utils.webhooks import trigger_webhook
                    import asyncio
                    asyncio.create_task(trigger_webhook(api_key_obj.user_id, "rate_limit_reached", {
                        "api_key_name": api_key_obj.name,
                        "limit": "day",
                        "value": limit_day
                    }))
                    return JSONResponse(
                        status_code=429,
                        content={"detail": "Rate limit exceeded (per day)"}
                    )
                
                # Atomic increment and expire
                pipe = self.redis_client.pipeline()
                pipe.incr(minute_key)
                pipe.expire(minute_key, 60, nx=True) # set expire only if key does not have an expiry
                pipe.incr(day_key)
                pipe.expire(day_key, 86400, nx=True)
                pipe.execute()
                
                # Update last used
                api_key_obj.last_used_at = datetime.utcnow()
                db.commit()

            start_time = time.time()
            response = await call_next(request)
            process_time = (time.time() - start_time) * 1000
            
            # Log usage
            if api_key_obj:
                usage_log = UsageLog(
                    api_key_id=api_key_obj.id,
                    user_id=api_key_obj.user_id,
                    endpoint=str(request.url.path),
                    method=request.method,
                    status_code=response.status_code,
                    response_time_ms=process_time,
                    ip_address=request.client.host if request.client else None,
                    timestamp=datetime.utcnow()
                )
                db.add(usage_log)
                db.commit()

                # BROADCAST VIA WEBSOCKET
                from app.api.websockets import manager
                import asyncio
                asyncio.create_task(manager.broadcast_to_user(api_key_obj.user_id, {
                    "type": "usage_update",
                    "endpoint": str(request.url.path),
                    "status_code": response.status_code,
                    "response_time_ms": process_time
                }))
            
            return response
        except Exception as e:
            print(f"Middleware error: {e}")
            return await call_next(request)
        finally:
            db.close()
