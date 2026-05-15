from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.config.database import get_db
from app.models import User, APIKey
from app.api.schemas import UserResponse, APIKeyResponse
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])

def check_admin(current_user: User):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Only administrators can access this resource")

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    return db.query(User).all()

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

@router.get("/api-keys", response_model=List[APIKeyResponse])
def list_all_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_admin(current_user)
    return db.query(APIKey).all()
