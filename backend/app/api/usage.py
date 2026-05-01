from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
from app.config.database import get_db
from app.models import UsageLog, User
from app.api.schemas import UsageLogResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/usage", tags=["usage"])


@router.get("/", response_model=List[UsageLogResponse])
def get_usage_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(UsageLog).filter(UsageLog.user_id == current_user.id)
    
    if start_date:
        query = query.filter(UsageLog.timestamp >= start_date)
    if end_date:
        query = query.filter(UsageLog.timestamp <= end_date)
    
    logs = query.order_by(UsageLog.timestamp.desc()).offset(skip).limit(limit).all()
    return logs


@router.get("/stats")
def get_usage_stats(
    days: int = Query(30, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_date = datetime.utcnow() - timedelta(days=days)
    now = datetime.utcnow()
    
    total_requests = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.timestamp >= start_date
    ).scalar()
    
    # RPM (Requests per minute) in the last hour
    last_hour = now - timedelta(hours=1)
    rpm = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.timestamp >= last_hour
    ).scalar() / 60.0
    
    latency_stats = db.query(
        func.avg(UsageLog.response_time_ms).label('avg'),
        func.min(UsageLog.response_time_ms).label('min'),
        func.max(UsageLog.response_time_ms).label('max')
    ).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.timestamp >= start_date,
        UsageLog.response_time_ms.isnot(None)
    ).first()
    
    error_count = db.query(func.count(UsageLog.id)).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.timestamp >= start_date,
        UsageLog.status_code >= 400
    ).scalar()
    
    # Endpoint breakdown
    endpoint_breakdown = db.query(
        UsageLog.endpoint,
        func.count(UsageLog.id).label('count'),
        func.avg(UsageLog.response_time_ms).label('avg_latency')
    ).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.timestamp >= start_date
    ).group_by(UsageLog.endpoint).order_by(func.count(UsageLog.id).desc()).limit(10).all()
    
    requests_by_day = db.query(
        func.date(UsageLog.timestamp).label('date'),
        func.count(UsageLog.id).label('count')
    ).filter(
        UsageLog.user_id == current_user.id,
        UsageLog.timestamp >= start_date
    ).group_by(func.date(UsageLog.timestamp)).all()
    
    return {
        "total_requests": total_requests,
        "rpm": round(rpm, 2),
        "latency_ms": {
            "avg": round(latency_stats.avg or 0, 2),
            "min": round(latency_stats.min or 0, 2),
            "max": round(latency_stats.max or 0, 2)
        },
        "error_count": error_count,
        "error_rate": round((error_count / total_requests * 100) if total_requests > 0 else 0, 2),
        "endpoint_breakdown": [
            {"endpoint": r[0], "count": r[1], "avg_latency_ms": round(r[2] or 0, 2)}
            for r in endpoint_breakdown
        ],
        "requests_by_day": [{"date": str(r[0]), "count": r[1]} for r in requests_by_day]
    }
