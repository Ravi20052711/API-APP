from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models import User
from app.api.schemas import UserResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only administrators can access user lists")
    
    return db.query(User).all()
