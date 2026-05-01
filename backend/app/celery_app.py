from celery import Celery
from app.config import settings

celery_app = Celery(
    "meterflow",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

# Optional: Periodic tasks configuration
celery_app.conf.beat_schedule = {
    "calculate-daily-usage-and-billing": {
        "task": "app.tasks.calculate_usage_and_billing",
        "schedule": 86400.0, # Daily
    },
}

celery_app.autodiscover_tasks(["app"])
