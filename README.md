# Task Tracker

Task Tracker is a full-stack, multi-tenant project management platform with sprint planning, QA test management, defect tracking, real-time chat, and an AI assistant.

---

## Services at a Glance

| Service | Stack | Default Port |
|---------|-------|-------------|
| **Backend** | Node.js + TypeScript + Express + PostgreSQL | 3000 |
| **Frontend** | React + TypeScript + Vite + Tailwind CSS | 3001 |
| **Database** | PostgreSQL + Flyway migrations | 5432 |
| **AI Assistant** | Python (stdlib only, optional Gemini) | 8787 |

---

## Repository Structure

```
Task-Tracker/
├── Backend/        # REST API — auth, tasks, projects, sprints, QA, chat, AI proxy
├── UI/             # React SPA — all user-facing pages and components
├── DB/             # PostgreSQL schema + Flyway migrations (schema V1xxx, seeds V2xxx)
├── AI/             # Standalone Python AI assistant service
├── render.yaml     # Render deploy blueprint for all services
└── README.md
```

---

## Feature Overview

### Core Features
- **Authentication** — Email/password with OTP verification, password reset, Auth0 support, JWT access + refresh tokens
- **Organizations** — Multi-tenant org creation, member management, invite codes
- **Projects** — CRUD, member roles (Admin/Member/Viewer), priority/status, file attachments, confidential access requests
- **Tasks** — Full lifecycle (To Do → In Progress → In Review → Done → Cancelled), priority, assignee, issue type, file attachments, subtasks, labels, comments
- **Sprints** — Sprint planning and board views (Dev board + QA board)

### QA & Test Management
- **Test Cases** — Modules, suites, steps, expected results, pass/fail status
- **Test Plans** — Group test cases by scope and coverage
- **Test Runs** — Execute plans, track pass/fail counts, traceability reports
- **Defects** — Bug reporting, priority, assignment, status workflow

### Collaboration & Productivity
- **Real-time Chat** — WebSocket-based group messaging with read receipts
- **Dashboard & Analytics** — Activity metrics, task statistics, workload overview
- **AI Assistant** — Task suggestions, day planning, project insights, workload forecasting, context-aware chat
- **Audit Log** — Full activity history for all user actions
- **Global Search** — Full-text search across projects, tasks, and more

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Yarn | any |
| Python | 3.10+ |
| Docker + Docker Compose | any |

---

## Quick Start (Local Development)

Run each service in its own terminal.

### 1. Start the database and run migrations

```bash
cd DB
docker-compose up -d postgres
docker-compose up migrator
```

Default connection:
- Host: `localhost` · Port: `5432` · Database: `task_tracker` · User: `postgres` · Password: `password`

### 2. Start the backend API

```bash
cd Backend
yarn install
cp config/env/.env.example config/env/.env
# Edit .env with your values (JWT secret, DB creds, email provider)
yarn dev
```

- API: `http://localhost:3000`
- Health: `GET /health` · `GET /ready`
- Swagger docs: `http://localhost:3000/api-docs`

### 3. Start the AI assistant

```bash
cd AI
python3 assistant_server.py
```

- URL: `http://127.0.0.1:8787`
- No external API key required (rule-based by default; Gemini optional)

### 4. Start the frontend

```bash
cd UI
yarn install
cp .env.example .env
yarn dev
```

- URL: `http://localhost:3001`

---

## Environment Variables Summary

### Backend (`Backend/config/env/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | Yes | Server port (default `3000`) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Yes | PostgreSQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` | Yes | JWT config |
| `EMAIL_PROVIDER` | Yes | `smtp`, `resend`, or `webhook` |
| `AI_PROVIDER` | No | `ollama`, `gemini`, or `auto` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |

See `Backend/config/env/.env.example` for the full list.

### Frontend (`UI/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend URL (e.g. `http://localhost:3000`) |
| `VITE_WS_BASE_URL` | WebSocket URL (e.g. `ws://localhost:3000`) |
| `VITE_AI_ASSISTANT_URL` | AI service URL (default `http://127.0.0.1:8787`) |
| `VITE_HIDE_AUTH0` | Set `true` to hide Auth0 options |
| `VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE` | Auth0 (optional) |

---

## API Surface

### Backend REST API (`/api`)

| Module | Prefix |
|--------|--------|
| Auth | `/api/auth` |
| Users | `/api/users` |
| Projects | `/api/projects` |
| Tasks | `/api/tasks` |
| Sprints | `/api/sprints` |
| Test Cases | `/api/test-cases` |
| Test Plans | `/api/test-plans` |
| Test Runs | `/api/test-runs` |
| Defects | `/api/defects` |
| Dashboard | `/api/dashboard` |
| Chat | `/api/chat` · WebSocket: `/ws/chat` |
| AI Proxy | `/api/ai` |
| Organizations | `/api/organizations` |
| Invites | `/api/invites` |
| Search | `/api/search` |
| Audit Logs | `/api/audit-logs` |
| Preferences | `/api/preferences` |

Full schema available at `http://localhost:3000/api-docs`.

### AI Service (direct)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health |
| `/ready` | GET | Readiness check |
| `/metrics` | GET | Runtime metrics |
| `/suggest-task` | POST | Suggest priority, due date, checklist |
| `/plan-day` | POST | Build a daily plan from tasks |
| `/project-insights` | POST | Risk assessment for a project |
| `/auto-insights` | POST | Page-aware insights and actions |
| `/workload-forecast` | POST | 7-day workload pressure forecast |
| `/chat-context` | POST | Context-aware conversational chat |

---

## Scripts Reference

### Backend
```bash
yarn dev       # Dev server with hot reload
yarn build     # Compile TypeScript
yarn start     # Run compiled server
yarn test      # Jest tests
yarn format    # Prettier
```

### Frontend
```bash
yarn dev       # Vite dev server (HMR)
yarn build     # Production build
yarn preview   # Preview production build
yarn test      # Vitest
yarn lint      # ESLint
```

---

## Deployment (Render)

The `render.yaml` blueprint defines four services:

| Service | Type |
|---------|------|
| `task-tracker-api` | Node.js web service |
| `task-tracker-ai` | Python web service |
| `task-tracker-frontend` | Static site (Vite build) |
| `task-tracker-db` | PostgreSQL managed database |

See each service's README for deployment-specific notes.

---

## Service Documentation

- [Backend/README.md](Backend/README.md) — API setup, routes, middleware, migrations
- [UI/README.md](UI/README.md) — Frontend setup, pages, components, environment
- [DB/README.md](DB/README.md) — Database schema, all migrations, Flyway configuration
- [AI/README.md](AI/README.md) — AI service setup, endpoints, Gemini integration

---

## License

MIT
