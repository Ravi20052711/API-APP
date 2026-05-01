from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import redis
from app.config.database import engine, Base, payments_engine
from app.models.payments import PaymentBase
from app.config import settings
from app.middleware import RateLimitMiddleware
from app.api import auth, api_keys, usage, billing, gateway, admin, proxy, webhooks, websockets

Base.metadata.create_all(bind=engine)
PaymentBase.metadata.create_all(bind=payments_engine)

app = FastAPI(
    title="MeterFlow API",
    description="Usage-Based API Billing Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
app.add_middleware(RateLimitMiddleware, redis_client=redis_client)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = (time.time() - start_time) * 1000
    response.headers["X-Process-Time"] = str(process_time)
    return response



@app.get("/")
def root():
    return {"message": "Welcome to MeterFlow API", "version": "1.0.0"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(api_keys.router, prefix="/api/v1")
app.include_router(usage.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
app.include_router(gateway.router, prefix="/api/v1")
app.include_router(proxy.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(webhooks.router, prefix="/api/v1")
app.include_router(websockets.router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
