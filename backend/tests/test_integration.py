import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.config.database import Base, get_db, get_payments_db
from app.models import APIKey, User, Subscription, UsageLog, SubscriptionPlan
from app.models.payments import PaymentBase, PaymentTransaction
import uuid

# Setup Test Database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

PAYMENTS_DATABASE_URL = "sqlite:///./test_payments.db"
p_engine = create_engine(PAYMENTS_DATABASE_URL, connect_args={"check_same_thread": False})
TestingPaymentsSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=p_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

def override_get_payments_db():
    try:
        db = TestingPaymentsSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_payments_db] = override_get_payments_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    PaymentBase.metadata.create_all(bind=p_engine)
    yield
    Base.metadata.drop_all(bind=engine)
    PaymentBase.metadata.drop_all(bind=p_engine)

def test_user_journey():
    # 1. Register
    email = f"test_{uuid.uuid4().hex[:6]}@example.com"
    response = client.post("/api/v1/auth/register", json={
        "email": email,
        "password": "password123",
        "full_name": "Test User"
    })
    assert response.status_code == 201
    assert response.json()["email"] == email

    # 2. Login
    response = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "password123"
    })
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Get Me
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    user_id = response.json()["id"]

    # 4. Create API Key (as Admin - we need to make this user an admin for testing)
    # Actually, let's just test listing keys first
    response = client.get("/api/v1/api-keys/", headers=headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

    # 5. Billing Plans
    response = client.get("/api/v1/billing/plans")
    assert response.status_code == 200

    # 6. Usage Stats
    response = client.get("/api/v1/usage/stats", headers=headers)
    assert response.status_code == 200
    assert "total_requests" in response.json()

    # 7. Webhooks
    response = client.post("/api/v1/webhooks/", headers=headers, json={
        "url": "https://example.com/webhook"
    })
    assert response.status_code == 201
    webhook_id = response.json()["id"]

    response = client.get("/api/v1/webhooks/", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) >= 1

    response = client.delete(f"/api/v1/webhooks/{webhook_id}", headers=headers)
    assert response.status_code == 204

def test_api_key_rotation():
    # Setup: Register and Login
    email = f"rot_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "pass", "full_name": "Rot User"})
    
    # Make user admin manually for this test
    db = TestingSessionLocal()
    user = db.query(User).filter(User.email == email).first()
    user.is_superuser = True
    db.commit()
    db.close()

    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create a key
    create_res = client.post("/api/v1/api-keys/", headers=headers, json={
        "name": "Rotation Test Key",
        "category": "AI"
    })
    assert create_res.status_code == 201
    key_id = create_res.json()["id"]
    original_key = create_res.json()["key"]

    # 2. Rotate it
    rotate_res = client.post(f"/api/v1/api-keys/{key_id}/rotate", headers=headers)
    assert rotate_res.status_code == 200
    new_key = rotate_res.json()["key"]
    assert new_key != original_key
    
    # 3. Verify in DB
    db = TestingSessionLocal()
    api_key_obj = db.query(APIKey).filter(APIKey.id == key_id).first()
    assert api_key_obj.previous_key == original_key
    assert api_key_obj.previous_key_expires_at is not None
    db.close()

from unittest.mock import patch, MagicMock

@patch("stripe.Customer.create")
@patch("stripe.checkout.Session.create")
def test_stripe_integration(mock_session, mock_customer):
    # Setup mocks
    mock_customer.return_value = MagicMock(id="cus_test_123")
    mock_session.return_value = MagicMock(url="https://checkout.stripe.com/test")
    
    email = f"stripe_{uuid.uuid4().hex[:6]}@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "pass", "full_name": "Stripe User"})
    login_res = client.post("/api/v1/auth/login", json={"email": email, "password": "pass"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # First need a plan in DB
    db = TestingSessionLocal()
    plan = SubscriptionPlan(
        name="Test Pro",
        price_monthly=49.0,
        stripe_price_id="price_test_123",
        included_requests=10000
    )
    db.add(plan)
    db.commit()
    plan_id = plan.id
    db.close()

    response = client.post(f"/api/v1/billing/create-checkout-session/{plan_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["url"] == "https://checkout.stripe.com/test"
