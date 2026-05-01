from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.models import User, APIKey
from datetime import datetime

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    
    from app.utils import create_access_token
    from jose import jwt, JWTError
    from app.config import settings
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user


async def get_api_key_from_header(request: Request, db: Session = Depends(get_db)) -> APIKey:
    api_key_str = request.headers.get("X-API-Key")
    
    if not api_key_str:
        raise HTTPException(status_code=401, detail="API key missing")
    
    # Check both current and previous keys
    api_key_obj = db.query(APIKey).filter(
        ((APIKey.key == api_key_str) | (APIKey.previous_key == api_key_str)),
        APIKey.is_active == True
    ).first()
    
    if not api_key_obj:
        raise HTTPException(status_code=401, detail="Invalid or inactive API key")

    # Check if it's the previous key and if it has expired
    if api_key_obj.previous_key == api_key_str:
        if not api_key_obj.previous_key_expires_at or api_key_obj.previous_key_expires_at < datetime.utcnow():
            raise HTTPException(status_code=403, detail="This rotated API key has expired. Please use the new one.")
    
    # Check expiration of the main key (if it's the current key)
    elif api_key_obj.expires_at and api_key_obj.expires_at < datetime.utcnow():
        raise HTTPException(status_code=403, detail="API key has expired")
    
    api_key_obj.last_used_at = datetime.utcnow()
    db.commit()
    
    return api_key_obj
