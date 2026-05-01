# MeterFlow Frontend

React-based dashboard for the MeterFlow API Billing Platform.

## Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

The app will be available at http://localhost:5173

## Features

- **User Authentication**: Login/Register with JWT tokens
- **API Key Management**: Create, view, toggle, and delete API keys
- **Usage Analytics**: Visual charts showing API usage over time
- **Billing & Plans**: View and subscribe to subscription plans

## Tech Stack

- React 18
- React Router v6
- React Query (TanStack Query)
- Tailwind CSS
- Recharts (for analytics)
- Lucide React (icons)
- Axios (HTTP client)
- React Hot Toast (notifications)

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── APIKeys.jsx
│   │   ├── UsageStats.jsx
│   │   ├── BillingPlans.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   └── Register.jsx
│   ├── hooks/
│   │   └── useAuth.js
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

## API Configuration

The frontend connects to the backend at `http://localhost:8000/api/v1`.

To change the API URL, edit `src/services/api.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000/api/v1';
```

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder.
