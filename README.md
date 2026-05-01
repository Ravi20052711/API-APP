# 🚀 MeterFlow - Usage-Based API Billing Platform

A full-stack SaaS platform that allows developers to create APIs, generate API keys, track usage, apply rate limiting, and calculate billing based on usage.

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Tailwind CSS + React Query |
| Backend | Python + FastAPI |
| Database | MySQL |
| Cache | Redis |
| Queue | Celery (optional) |

## 📁 Project Structure

```
meterflow/
├── backend/           # Python FastAPI backend
│   ├── app/
│   │   ├── api/      # API routes and schemas
│   │   ├── config/   # Configuration and database
│   │   ├── middleware/ # Auth and rate limiting
│   │   ├── models/   # SQLAlchemy models
│   │   ├── utils/    # Helper functions
│   │   └── main.py   # Application entry point
│   ├── requirements.txt
│   └── seed_data.py
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
docker-compose up -d
```

This starts MySQL, Redis, backend, and frontend.

### Option 2: Manual Setup

#### Backend Setup

1. Create MySQL database:
```sql
CREATE DATABASE meterflow;
```

2. Setup Python environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

3. Configure environment:
```bash
copy .env.example .env
# Edit .env with your database credentials
```

4. Run migrations and seed data:
```bash
python seed_data.py
```

5. Start backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:5173

## 📚 API Documentation

Once backend is running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 🔑 Default Subscription Plans

On first run, these plans are seeded:

| Plan | Price/Month | Requests | Rate Limit |
|------|-------------|----------|------------|
| Free | $0 | 1,000 | 10 req/min |
| Starter | $29 | 50,000 | 60 req/min |
| Pro | $99 | 500,000 | 300 req/min |
| Enterprise | $499 | 5,000,000 | 1000 req/min |

## ✨ Features

- ✅ User authentication (register/login)
- ✅ API key generation and management
- ✅ Rate limiting (per minute and per day)
- ✅ Usage tracking and analytics
- ✅ Real-time dashboard with charts
- ✅ Subscription plans
- ✅ Responsive UI with Tailwind CSS

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/meterflow
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-here
```

### Frontend
No environment variables needed by default. Edit `src/services/api.js` to change API URL.

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `GET /api/v1/auth/me` - Get current user

### API Keys
- `GET /api/v1/api-keys/` - List all API keys
- `POST /api/v1/api-keys/` - Create new API key
- `PUT /api/v1/api-keys/{id}/toggle` - Toggle API key status
- `DELETE /api/v1/api-keys/{id}` - Delete API key

### Usage
- `GET /api/v1/usage/` - Get usage logs
- `GET /api/v1/usage/stats` - Get usage statistics

### Billing
- `GET /api/v1/billing/plans` - List subscription plans
- `GET /api/v1/billing/subscription` - Get current subscription

## 🧪 Testing

```bash
# Backend (pytest not included yet)
pytest

# Frontend
npm test
```

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a PR.
