# Task Tracker

Task Tracker is a multi-service project management platform with:

- **Backend API** (Node.js + TypeScript + Express + PostgreSQL)
- **Frontend Web App** (React + TypeScript + Vite + Tailwind)
- **Database migrations/seeding** (Flyway + PostgreSQL)
- **AI Assistant service** (Python HTTP service with rule-based + optional Gemini support)

---

## Repository Structure

```text
Task-Tracker/
├── Backend/     # REST API, auth, task/project logic
├── UI/          # React frontend
├── DB/          # PostgreSQL + Flyway migrations/seeds
├── AI/          # Separate Python AI assistant service
├── render.yaml  # Render blueprint for all services
└── README.md
```

---

## What You Get

### Core product capabilities
- Authentication (email/password, OTP flows, Auth0 support in backend APIs)
- Role-based access (Admin, Member, Viewer)
- Task management (status, priority, assignee, due dates)
- Project management (members, files, activity, confidential access requests)
- AI-assisted productivity features (chat + planning endpoints)

### Deployment-ready layout
- Independent deploy targets for API, UI, and AI service
- Render blueprint (`render.yaml`) for reproducible cloud setup
- Dockerized DB + migration workflow

---

## Prerequisites

Install these locally before running the full stack:

- **Node.js 18+**
- **Yarn**
- **Python 3.10+** (for `AI/` service)
- **Docker + Docker Compose** (for PostgreSQL + Flyway migrations)

---

## Quick Start (Local Development)

> Recommended: run each service in its own terminal.

### 1) Start database + run migrations

```bash
cd DB
docker-compose up -d postgres
docker-compose up migrator
```

Database defaults from `DB/docker-compose.yml`:
- Host: `localhost`
- Port: `5432`
- DB: `task_tracker`
- User: `postgres`
- Password: `password`

### 2) Start backend API

```bash
cd Backend
yarn install
cp config/env/.env.example config/env/.env
yarn dev
```

Backend default URL: `http://localhost:3000`

Useful health/docs endpoints:
- `GET /health`
- `GET /ready`
- Swagger: `http://localhost:3000/api-docs`

### 3) Start AI service

```bash
cd AI
pip install -r requirements.txt
python3 assistant_server.py
```

AI default URL: `http://127.0.0.1:8787`

### 4) Start frontend

```bash
cd UI
yarn install
cp .env.example .env
yarn dev
```

Frontend default URL: `http://localhost:3001`

---

## Environment Variables (high-level)

### Backend (`Backend/config/env/.env`)
Common required values:

- `PORT=3000`
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- AI provider values (`AI_PROVIDER`, and optionally Gemini/Ollama settings)

### Frontend (`UI/.env`)

- `VITE_API_BASE_URL=http://localhost:3000`
- `VITE_WS_BASE_URL=ws://localhost:3000`
- `VITE_AI_ASSISTANT_URL=http://127.0.0.1:8787`
- `VITE_AI_API_KEY=` (optional)

### AI service (optional)

- `AI_ASSISTANT_HOST`, `AI_ASSISTANT_PORT` / `PORT`
- `AI_ALLOWED_ORIGINS`
- `AI_API_KEY` (if you want protected POST endpoints)
- `AI_CHAT_PROVIDER` + optional Gemini keys/config

For complete service-specific configuration, see each module README.

---

## Module Documentation

Use the module-level READMEs below for setup, environment variables, scripts, API details, and deployment notes specific to each service.

| Module | Purpose | Documentation |
|---|---|---|
| `Backend/` | Express + TypeScript API, auth, task/project endpoints, Swagger | [`Backend/README.md`](Backend/README.md) |
| `UI/` | React + Vite frontend app and client-side integration | [`UI/README.md`](UI/README.md) |
| `DB/` | PostgreSQL container setup, Flyway schema/seeder migrations | [`DB/README.md`](DB/README.md) |
| `AI/` | Python AI assistant service and inference endpoint details | [`AI/README.md`](AI/README.md) |

---

## API Surface (summary)

### Backend API (`/api`)
- Auth: register/login/profile + OTP/password reset flows
- Tasks: CRUD, activity, VCS-related task endpoints
- Projects: CRUD, stats, roadmap, files, members, confidential access workflow
- AI proxy: `/api/ai/chat`

Use Swagger for endpoint details and request/response schemas:
`http://localhost:3000/api-docs`

### AI Service (direct)
- `/health`, `/ready`, `/metrics`
- `/suggest-task`
- `/plan-day`
- `/project-insights`
- `/auto-insights`
- `/workload-forecast`
- `/chat-context`

---

## Scripts Cheat Sheet

### Backend
- `yarn dev` – run in dev mode
- `yarn build` – compile TypeScript
- `yarn start` – run compiled server
- `yarn test` – run Jest tests

### Frontend
- `yarn dev` – run Vite dev server
- `yarn build` – build production bundle
- `yarn test` – run Vitest
- `yarn preview` – preview build

### Root
- `./deploy.sh` – helper script for Render-oriented build steps

---

## Deployment

- Primary blueprint: [`render.yaml`](render.yaml)
- Services defined there:
  - `task-tracker-api` (Node web service)
  - `task-tracker-ai` (Python web service)
  - `task-tracker-frontend` (static site)
  - `task-tracker-db` (PostgreSQL)

---

## Notes

- This is a **monorepo** with independent service lifecycles.
- There is **no single root `docker-compose.yml`** orchestrating all services; DB orchestration lives in `DB/`.
- If you only need one part (e.g., frontend), you can run that module independently.

---

## License

MIT
