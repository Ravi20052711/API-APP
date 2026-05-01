# MeterFlow Backend

Usage-based API Billing Platform backend built with Python + FastAPI + MySQL.

## Setup

### Prerequisites
- Python 3.11+
- MySQL 8.0+
- Redis 7+

### Installation

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy `.env.example` to `.env` and configure:
```bash
copy .env.example .env
```

4. Create MySQL database:
```sql
CREATE DATABASE meterflow;
```

5. Run database migrations (happens automatically on first run)

6. Seed initial data:
```bash
python seed_data.py
```

7. Start the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user

### API Keys
- `GET /api/v1/api-keys/` - List API keys
- `POST /api/v1/api-keys/` - Create API key
- `PUT /api/v1/api-keys/{id}/toggle` - Toggle API key status
- `DELETE /api/v1/api-keys/{id}` - Delete API key

### Usage
- `GET /api/v1/usage/` - Get usage logs
- `GET /api/v1/usage/stats` - Get usage statistics

### Billing
- `GET /api/v1/billing/plans` - List subscription plans
- `POST /api/v1/billing/plans` - Create plan (admin only)
- `GET /api/v1/billing/subscription` - Get current subscription

## Using Docker

```bash
docker-compose up -d
```

## Project Structure

```
backend/
├── app/
│   ├── api/          # API routes and schemas
│   ├── config/       # Configuration and database
│   ├── middleware/   # Auth and rate limiting
│   ├── models/       # SQLAlchemy models
│   ├── services/     # Business logic
│   ├── utils/        # Helper functions
│   └── main.py       # Application entry point
├── requirements.txt
└── seed_data.py
```
