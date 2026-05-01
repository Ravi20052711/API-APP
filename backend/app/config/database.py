from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

payments_engine = create_engine(settings.PAYMENTS_DATABASE_URL, echo=True)
PaymentsSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=payments_engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_payments_db():
    db = PaymentsSessionLocal()
    try:
        yield db
    finally:
        db.close()
