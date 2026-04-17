# Task Tracker — Backend

Node.js/TypeScript REST API built with Express, PostgreSQL, and Sequelize. Handles authentication, project/task management, sprint planning, QA workflows, real-time chat, and AI proxy.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript 5 |
| Framework | Express 5 |
| ORM | Sequelize 6 + sequelize-typescript |
| Database | PostgreSQL 12+ |
| Auth | JWT (access + refresh tokens), bcrypt, OTP |
| Email | Nodemailer (SMTP / Resend / webhook) |
| File uploads | Multer + Cloudinary |
| API docs | Swagger / OpenAPI |
| Testing | Jest |
| Formatter | Prettier |

---

## Prerequisites

- Node.js 18+
- Yarn
- PostgreSQL 12+ (or Docker)

---

## Setup

### 1. Install dependencies

```bash
cd Backend
yarn install
```

### 2. Configure environment

```bash
cp config/env/.env.example config/env/.env
```

Minimum required values:

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=task_tracker
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=change-me
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-me-refresh
JWT_REFRESH_EXPIRES_IN=30d

# Email (choose one provider)
EMAIL_PROVIDER=smtp
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
OTP_FROM_EMAIL=TaskTracker <your@gmail.com>
```

See `config/env/.env.example` for the full list of optional variables.

### 3. Start the database and run migrations

```bash
# From the DB/ directory (one level up):
docker-compose up -d postgres
docker-compose up migrator
```

Or point `DB_*` variables at an existing PostgreSQL instance and run migrations manually.

### 4. Start the dev server

```bash
yarn dev
```

API runs at `http://localhost:3000`.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Hot-reload dev server (nodemon + ts-node) |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn start` | Run compiled server |
| `yarn test` | Jest test suite |
| `yarn format` | Prettier (write) |
| `yarn format:check` | Prettier (check only) |

---

## Project Structure

```
Backend/
├── src/
│   ├── controllers/      # Route handlers (one file per resource)
│   ├── services/         # Business logic
│   ├── models/           # Sequelize models
│   ├── routes/           # Express routers
│   ├── middleware/       # Auth, rate limiting, validation, error handling
│   ├── validators/       # express-validator rule sets
│   ├── config/           # Sequelize init, app bootstrap
│   ├── docs/swagger/     # OpenAPI YAML specs
│   └── utils/            # Shared helpers
├── config/
│   └── env/              # .env and .env.example
└── package.json
```

---

## API Routes

Full interactive docs: `http://localhost:3000/api-docs`

### Auth — `/api/auth`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | Register a new user |
| POST | `/login` | Login, returns access + refresh tokens |
| POST | `/logout` | Invalidate refresh token |
| GET | `/me` | Current authenticated user |
| POST | `/refresh` | Refresh access token |
| POST | `/otp/send` | Send OTP to email |
| POST | `/otp/verify` | Verify OTP code |
| POST | `/forgot-password` | Send password reset email |
| POST | `/reset-password` | Reset password with token |
| POST | `/change-password` | Change password (authenticated) |
| POST | `/auth0` | Auth0 callback handler |

### Users — `/api/users`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List all users |
| GET | `/:id` | Get user by ID |
| PATCH | `/:id` | Update user profile |
| DELETE | `/:id` | Delete user |

### Projects — `/api/projects`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List projects (with filters) |
| POST | `/` | Create project |
| GET | `/:id` | Get project details |
| PATCH | `/:id` | Update project |
| DELETE | `/:id` | Delete project |
| GET | `/:id/members` | List project members |
| POST | `/:id/members` | Add member |
| DELETE | `/:id/members/:userId` | Remove member |
| GET | `/:id/files` | List project files |
| POST | `/:id/files` | Upload file |
| GET | `/:id/stats` | Project statistics |
| GET | `/:id/roadmap` | Project roadmap |
| POST | `/:id/access-requests` | Request confidential access |
| GET | `/:id/access-requests` | List access requests |
| PATCH | `/:id/access-requests/:reqId` | Approve/deny request |

### Tasks — `/api/tasks`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List tasks (pagination, filters) |
| POST | `/` | Create task |
| GET | `/:id` | Get task |
| PATCH | `/:id` | Update task |
| DELETE | `/:id` | Delete task |
| POST | `/:id/subtasks` | Add subtask |
| PATCH | `/:id/subtasks/:subId` | Update subtask |
| DELETE | `/:id/subtasks/:subId` | Delete subtask |
| POST | `/:id/comments` | Add comment |
| GET | `/:id/comments` | List comments |
| POST | `/:id/files` | Attach file |
| GET | `/:id/files` | List task files |
| POST | `/:id/labels` | Add label |
| DELETE | `/:id/labels/:labelId` | Remove label |
| GET | `/:id/links` | Task relationships |

### Sprints — `/api/sprints`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List sprints (by project) |
| POST | `/` | Create sprint |
| GET | `/:id` | Get sprint |
| PATCH | `/:id` | Update sprint |
| DELETE | `/:id` | Delete sprint |
| POST | `/:id/tasks` | Add task to sprint |
| DELETE | `/:id/tasks/:taskId` | Remove task from sprint |

### Test Cases — `/api/test-cases`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List test cases |
| POST | `/` | Create test case |
| GET | `/:id` | Get test case |
| PATCH | `/:id` | Update test case |
| DELETE | `/:id` | Delete test case |
| GET | `/suites` | List suites |
| GET | `/modules` | List modules |

### Test Plans — `/api/test-plans`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List test plans |
| POST | `/` | Create plan |
| GET | `/:id` | Get plan |
| PATCH | `/:id` | Update plan |
| DELETE | `/:id` | Delete plan |

### Test Runs — `/api/test-runs`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List test runs |
| POST | `/` | Create test run |
| GET | `/:id` | Get run details |
| PATCH | `/:id` | Update run results |

### Defects — `/api/defects`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | List defects |
| POST | `/` | Create defect |
| GET | `/:id` | Get defect |
| PATCH | `/:id` | Update defect |
| DELETE | `/:id` | Delete defect |

### Dashboard — `/api/dashboard`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/summary` | Task counts, project overview |
| GET | `/activity` | Recent activity feed |

### Chat — `/api/chat` + WebSocket `/ws/chat`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/groups` | List chat groups |
| POST | `/groups` | Create group |
| GET | `/groups/:id/messages` | Message history |
| WS | `/ws/chat` | Real-time messaging |

### Organizations — `/api/organizations`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Get organization info |
| POST | `/` | Create organization |
| PATCH | `/:id` | Update organization |
| GET | `/:id/members` | List members |
| POST | `/:id/members` | Add member |

### Other Modules

| Prefix | Description |
|--------|-------------|
| `/api/invites` | Invitation management |
| `/api/search` | Full-text search |
| `/api/audit-logs` | Audit trail |
| `/api/preferences` | User preferences |
| `/api/ai` | AI assistant proxy |

---

## Middleware

| Middleware | Purpose |
|-----------|---------|
| `authenticateToken` | Verify JWT access token |
| `cors` | Cross-origin control (env-configured origins) |
| `helmet` | Security headers |
| `express-rate-limit` | Per-route rate limiting |
| `throttle` | Delay-based request throttling |
| Request timeout | 30s guard on all routes |
| Cache-Control | No-store headers on API responses |
| Global error handler | Consistent JSON error shape |

---

## Authentication Flow

```
Register → OTP sent to email → verify OTP → account active
Login    → access token (15 min) + refresh token (30 days)
         → use refresh token at /api/auth/refresh to get new access token
         → logout invalidates refresh token
```

**Token storage:** The frontend stores the access token in memory and the refresh token in an httpOnly cookie (or localStorage depending on client implementation).

---

## Email / OTP Configuration

OTPs are delivered through the provider set in `EMAIL_PROVIDER`:

| Provider | Required Variables |
|----------|-------------------|
| `smtp` | `SMTP_HOST`, `SMTP_PORT`, `EMAIL_USER`, `EMAIL_PASS` |
| `resend` | `RESEND_API_KEY`, `OTP_FROM_EMAIL` (must use verified domain) |
| `webhook` | `OTP_EMAIL_WEBHOOK_URL` |

**Recipient filtering:**
- `EMAIL_ALLOWED_RECIPIENTS` — comma-separated whitelist (empty = all allowed)
- `EMAIL_RESTRICTED_RECIPIENTS` — comma-separated blocklist (always wins)

---

## AI Provider Configuration

The backend proxies AI requests to either Ollama (local) or Gemini (cloud):

| `AI_PROVIDER` | Behaviour |
|---------------|-----------|
| `ollama` | Local Ollama endpoint (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`) |
| `gemini` | Gemini API (`GEMINI_API_KEY`, `GEMINI_MODEL`) |
| `auto` | Prefers Gemini when key exists, falls back to Ollama |

On provider failure the backend returns a safe fallback response.

---

## Database Schema (Key Tables)

> For the full migration history see [DB/README.md](../DB/README.md).

| Table | Description |
|-------|-------------|
| `users` | first_name, last_name, email, password_hash, role (Admin/Member/Viewer) |
| `projects` | name, description, owner_id, status, priority, start/end dates |
| `project_members` | project_id, user_id, role |
| `tasks` | title, description, status, priority, issue_type, assignee_id, sprint_id |
| `subtasks` | task_id, title, is_completed, position |
| `comments` | task_id, user_id, content |
| `labels` / `task_labels` | tagging many-to-many |
| `sprints` | project_id, name, status, start/end dates, goal |
| `defects` | project_id, title, priority, status, assigned_to |
| `test_cases` | suite_id, module_id, title, steps, expected_result, status |
| `test_plans` | project_id, name, scope |
| `test_runs` | plan_id, status, passed_count, failed_count |
| `chat_groups` / `chat_messages` | group messaging |
| `organizations` | multi-tenant org |
| `auth_otps` | OTP codes, purpose, expiry, attempt count |
| `auth_refresh_tokens` | hashed refresh tokens |
| `audit_logs` | full activity trail |

---

## Adding a New Feature

1. Add a SQL migration in `DB/migrations/schema/` (next `V1xxx` number)
2. Create a Sequelize model in `src/models/`
3. Write business logic in `src/services/`
4. Add route handlers in `src/controllers/`
5. Register routes in `src/routes/` and mount in the app
6. Add validation rules in `src/validators/`
7. Document in `src/docs/swagger/`

---

## Production Deployment

```bash
yarn build
yarn start
```

Set `NODE_ENV=production` and all required env vars. Migrations run automatically via the Flyway migrator container before the API starts (see `render.yaml`).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on DB | Ensure PostgreSQL is running and `DB_*` vars match |
| Migration failures | Check version numbering (schema = V1xxx, seeds = V2xxx) |
| OTP emails not arriving | Verify `EMAIL_PROVIDER` config; check `EMAIL_ALLOWED_RECIPIENTS` |
| 401 on all routes | Check `JWT_SECRET` matches between token issue and verification |
| CORS errors from UI | Add frontend origin to `ALLOWED_ORIGINS` env var |
