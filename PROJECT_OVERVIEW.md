# 🚀 MeterFlow: Usage-Based API Billing Platform - Project Overview

## 📌 1. Project Introduction
**MeterFlow** is a comprehensive SaaS platform designed for API providers to manage, monetize, and monitor their APIs. It enables developers to turn their backend services into a subscription-based product by providing robust API key management, real-time usage tracking, and automated rate limiting.

The platform acts as a "Smart Gateway" or "Proxy" layer between the API consumer and the actual upstream service.

---

## 🛠️ 2. Tech Stack

### **Frontend**
- **Framework:** React 18 (Vite for fast builds)
- **Styling:** Tailwind CSS (Responsive and modern UI)
- **State Management & Data Fetching:** React Query (TanStack Query) for efficient caching and synchronization.
- **Charts/Analytics:** Recharts for visualizing API usage, latency, and error rates.
- **Icons:** Lucide React.
- **Notifications:** React Hot Toast.

### **Backend**
- **Framework:** Python FastAPI (High performance, asynchronous, automatic Swagger docs).
- **ORM:** SQLAlchemy 2.0 (Database abstraction).
- **Task Queue:** Celery (For asynchronous tasks like sending emails or processing webhooks).
- **Real-time:** WebSockets (For live dashboard updates).
- **Authentication:** JWT (JSON Web Tokens) via `python-jose` and `passlib` (Bcrypt).

### **Infrastructure & Data**
- **Database:** MySQL (Primary storage for users, keys, and usage logs). *SQLite is used in development.*
- **Cache:** Redis (Used for high-speed rate limiting and potentially as a Celery broker).
- **Payments:** Custom UPI Payment Flow + Stripe Integration (For flexible subscription billing).
- **Proxying:** `httpx` (Asynchronous HTTP client for forwarding requests).
- **Containerization:** Docker & Docker Compose.

---

## ⚙️ 3. Core Architecture & Workflow

### **A. User Workflow**
1. **Onboarding:** A developer registers on the platform and logs in.
2. **Subscription:** The user chooses a plan (Free, Starter, Pro, Enterprise).
3. **Payment Flow:** 
   - For premium plans, the platform features a **Custom UPI Payment Workflow**.
   - Users are guided through a multi-step UI to pay via UPI (manual transfer to merchant ID).
   - Once payment is confirmed (mocked/automated verification), the subscription is activated.
4. **API Key Generation:** The user generates a unique API key. They can also configure an **Upstream URL** (the destination API) and an **Upstream Key** (secret for the destination).
5. **Integration:** The developer integrates the API by calling the MeterFlow Proxy endpoint instead of their direct backend.

### **B. Request Lifecycle (The "Smart Gateway" Logic)**
When an API request hits the platform:
1. **Middleware Interception:** The `RateLimitMiddleware` catches the request.
2. **Authentication:** It extracts the `X-API-Key` and validates it against the database.
3. **Rate Limiting (Redis):** 
   - It checks Redis for the current request count for that key (Per-Minute and Per-Day).
   - If the limit is exceeded, it returns `429 Too Many Requests`.
4. **Proxying:** If allowed, the `proxy` route takes the request, replaces headers (e.g., adds the secret Upstream Key), and forwards it to the target service using `httpx`.
5. **Response & Logging:** 
   - The response from the upstream is sent back to the client.
   - The middleware calculates the `response_time_ms`.
   - A `UsageLog` is saved to the database (Endpoint, Status Code, IP, Latency).
6. **Real-time Update:** The server broadcasts the usage data via **WebSockets** so the user's dashboard updates instantly without refreshing.

---

## ✨ 4. Key Features

- **Multi-tenant API Keys:** Users can manage multiple keys for different environments (Dev/Prod).
- **Key Rotation:** Supports seamless key rotation with "previous key" grace periods.
- **Granular Analytics:** Detailed stats on RPM (Requests Per Minute), Latency (Avg/Min/Max), and Error Rates.
- **Tiered Rate Limiting:** Enforcement of quotas based on subscription levels.
- **Webhooks:** Automated notifications to user-defined URLs when events occur (e.g., "90% of quota used").
- **Modern Dashboard:** A clean, dark-themed (or modern) UI for managing the entire lifecycle.

---

## ❓ 5. Viva / Interview Questions & Answers

1. **Q: What is the primary purpose of MeterFlow?**
   - **A:** It is a usage-based billing platform that allows API developers to manage subscriptions, track usage, and enforce rate limits on their APIs.

2. **Q: Why did you choose FastAPI over Flask or Django?**
   - **A:** FastAPI is natively asynchronous (great for proxying), faster in benchmarks, and provides automatic interactive API documentation (Swagger).

3. **Q: How is rate limiting implemented in this project?**
   - **A:** Using Redis for high-speed atomic increments. We track request counts per minute and per day for each API key.

4. **Q: How does the Proxying mechanism work?**
   - **A:** It uses the `httpx` library to receive a request, modify headers (adding upstream credentials), forward it to the destination, and return the response.

5. **Q: What happens if the Redis server goes down?**
   - **A:** Depending on the implementation, the middleware might fail-safe (allow all) or fail-secure (block all). In a production environment, Redis would be highly available.

6. **Q: How do you handle real-time updates on the dashboard?**
   - **A:** Using WebSockets. When a request is logged, a message is broadcasted to the specific user's socket connection to update their charts instantly.

7. **Q: Why use React Query (TanStack Query) for the frontend?**
   - **A:** It simplifies server-state management, handles auto-refetching, caching, and loading/error states out of the box.

8. **Q: How are API keys securely stored?**
   - **A:** API keys are hashed (like passwords) or stored securely. In this project, we use unique strings, but in a production setup, one-way hashing is recommended if the keys are only shown once.

9. **Q: What is "Key Rotation" and how is it implemented?**
   - **A:** It's the process of replacing an old key with a new one. We implement it by keeping a `previous_key` field with an expiration time to avoid breaking client integrations during the switch.

10. **Q: How do you track the latency of the upstream API?**
    - **A:** By capturing the time just before the `httpx` request and just after the response, calculating the difference in milliseconds.

11. **Q: What is the role of SQLAlchemy in the project?**
    - **A:** It serves as an ORM (Object-Relational Mapper) to interact with the MySQL database using Python objects instead of raw SQL queries.

12. **Q: How are different subscription plans enforced?**
    - **A:** Each `Subscription` model is linked to a `Plan` which contains `limit_per_minute` and `limit_per_day` values. The middleware checks these values against Redis counts.

13. **Q: What information is stored in the `UsageLog` table?**
    - **A:** User ID, API Key ID, endpoint path, HTTP method, status code, response time (ms), IP address, and timestamp.

14. **Q: How do you handle Cross-Origin Resource Sharing (CORS)?**
    - **A:** Using FastAPI's `CORSMiddleware` to allow the React frontend (running on a different port/domain) to communicate with the backend.

15. **Q: What is a Webhook, and how does MeterFlow use them?**
    - **A:** A webhook is a callback where our server sends data to a user's server when an event occurs. We use them for rate limit alerts or billing notifications.

16. **Q: How would you scale this application to handle millions of requests?**
    - **A:** Use a Load Balancer (Nginx/HAProxy), scale the FastAPI workers, use a Redis Cluster, and implement database indexing/sharding for usage logs.

17. **Q: Why use Tailwind CSS?**
    - **A:** It allows for rapid UI development using utility classes and ensures a consistent design without writing large amounts of custom CSS.

18. **Q: How do you ensure the API documentation is always up to date?**
    - **A:** FastAPI automatically generates OpenAPI schemas and serves them via `/docs` based on the Pydantic models and route definitions.

19. **Q: What is the purpose of `docker-compose` in this project?**
    - **A:** To orchestrate multiple containers (Backend, Frontend, MySQL, Redis) so they can work together in an isolated environment with a single command.

20. **Q: If a user changes their subscription plan, how is it reflected in the system?**
    - **A:** The `Subscription` record is updated in the database. The middleware fetches the latest limits on each request (or caches them for a short duration) to apply the new quotas immediately.
