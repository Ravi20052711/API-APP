from app.config.database import SessionLocal
from app.models import User
from app.utils import get_password_hash

def seed_admin():
    db = SessionLocal()
    try:
        # Check if Ravi exists
        admin = db.query(User).filter(User.email == "ravi@example.com").first()
        if not admin:
            admin = User(
                email="ravi@example.com",
                full_name="Ravi",
                hashed_password=get_password_hash("Ravi23345"),
                is_superuser=True
            )
            db.add(admin)
            db.commit()
            print("Admin 'Ravi' created successfully!")
        else:
            admin.full_name = "Ravi"
            admin.hashed_password = get_password_hash("Ravi23345")
            admin.is_superuser = True
            db.commit()
            print("Admin 'Ravi' updated successfully!")
    except Exception as e:
        print(f"Error seeding admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
