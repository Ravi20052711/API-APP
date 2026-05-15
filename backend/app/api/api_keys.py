from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import secrets
from app.config.database import get_db
from app.models import APIKey, User
from app.api.schemas import APIKeyCreate, APIKeyResponse
from app.middleware.auth import get_current_user
import httpx

router = APIRouter(prefix="/api-keys", tags=["api-keys"])

@router.get("/", response_model=List[APIKeyResponse])
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(APIKey).filter(APIKey.user_id == current_user.id).all()

@router.post("/", response_model=APIKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    key_data: APIKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    import urllib.parse
    if key_data.upstream_url:
        parsed = urllib.parse.urlparse(key_data.upstream_url)
        if not all([parsed.scheme, parsed.netloc]):
            raise HTTPException(status_code=400, detail="Invalid upstream URL. Must include scheme and host.")
        try:
            # Basic URL validation and reachability check
            async with httpx.AsyncClient() as client:
                res = await client.head(key_data.upstream_url, timeout=5.0)
                # We don't strictly require 200, just that the host is reachable
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid or unreachable upstream URL: {str(e)}")

    api_key = APIKey(
        **key_data.model_dump(),
        user_id=current_user.id,
        key=f"mf_{secrets.token_urlsafe(32)}"
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return api_key

@router.put("/{key_id}/toggle", response_model=APIKeyResponse)
def toggle_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    api_key.is_active = not api_key.is_active
    db.commit()
    db.refresh(api_key)
    return api_key

@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")

    db.delete(api_key)
    db.commit()

@router.post("/{key_id}/rotate", response_model=APIKeyResponse)
def rotate_api_key(
    key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from datetime import datetime, timedelta
    
    api_key = db.query(APIKey).filter(
        APIKey.id == key_id,
        APIKey.user_id == current_user.id
    ).first()
    
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key not found")

    # Store current key as previous, set expiry for 7 days
    api_key.previous_key = api_key.key
    api_key.previous_key_expires_at = datetime.utcnow() + timedelta(days=7) # 7-day grace period
    
    # Generate new key
    api_key.key = f"mf_{secrets.token_urlsafe(32)}"
    
    db.commit()
    db.refresh(api_key)
    return api_key
