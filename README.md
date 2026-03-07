# Task Tracker

Task Tracker is a full-stack project and task management platform with role-based access control, confidentiality workflows, and AI-assisted planning.

This is the **main repository README**. Detailed setup and service-specific instructions are documented in module READMEs.

## Repository Map

```text
Task-Tracker/
├── Backend/     # API server (Node.js + TypeScript + Express)
├── UI/          # Frontend app (React + TypeScript + Vite)
├── DB/          # Flyway migrations + seeds
├── AI/          # AI service
└── README.md    # Main project overview (this file)
```

## Module Documentation

- Backend setup and API runtime: [Backend/README.md](Backend/README.md)
- Frontend setup and UI runtime: [UI/README.md](UI/README.md)
- Database and migration setup: [DB/README.md](DB/README.md)
- AI service setup and endpoints: [AI/README.md](AI/README.md)

## Highlights

### Authentication and Security
- JWT authentication
- Auth0 login support
- OTP verification and password reset flows
- Role-based authorization (`Admin`, `Member`, `Viewer`)

### Task Workspace
- Task CRUD with assignee and due date support
- Status lifecycle: `To Do`, `In Progress`, `Done`
- Priority lifecycle: `Low`, `Medium`, `High`
- Multi-tab task interface:
  - `Overview`
  - `Board`
  - `Timeline`
  - `AI Planner`
- Saved views and pinned tasks

### Project Workspace
- Project CRUD with ownership and members
- Member role management (`owner`, `admin`, `member`, `viewer`)
- Project detail tabs:
  - Tasks
  - Roadmap
  - Files
  - Activity
- Project file uploads
- Project activity logs

### Confidential Access Workflow
- Confidential project details can be restricted
- Members can request confidential access with reason
- Owner/admin review flow (approve/reject)
- Request state tracking (`none`, `pending`, `approved`, `rejected`)

### AI Capabilities
- AI chat endpoint (`/api/ai/chat`)
- AI day planner integrated in Tasks page
- AI assistant widget in application layout

## Role Permissions Matrix

| Capability | Admin | Member | Viewer |
|---|---|---|---|
| Login and access app | Yes | Yes | Yes |
| View tasks/projects they can access | Yes | Yes | Yes |
| Create tasks | Yes | Yes | No |
| Update task details/status | Yes | Yes | No |
| Delete tasks | Yes | Yes | No |
| Create projects | Yes | Yes | No |
| Update project details (owner/admin in project) | Yes | Yes | No |
| Manage project members (owner/admin in project) | Yes | Yes | No |
| Request confidential access | Yes | Yes | Yes |
| Review confidential access requests | Yes | Owner/Admin only | No |
| Delete project | Yes | Owner only | No |

## Quick Start (Top-Level)

### 1) Clone

```bash
git clone <repository-url>
cd Task-Tracker
```

### 2) Environment

```bash
cp .env.example .env
```

### 3) Run with Docker

```bash
docker-compose up -d
docker-compose logs -f
```

## Service URLs (Default)

- Frontend: `http://localhost:3001`
- Backend API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/api-docs`
- PostgreSQL: `localhost:5433`

## Primary API Surface

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/auth0`
- `POST /api/auth/verify-otp`
- `POST /api/auth/resend-otp`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/me`

### Tasks
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/tasks/:id/activity`
- `GET /api/tasks/:id/pull-requests`
- `GET /api/tasks/:id/commits`

### Projects
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`
- `GET /api/projects/:id/stats`
- `GET /api/projects/:id/roadmap`
- `GET /api/projects/:id/files`
- `POST /api/projects/:id/files/upload`
- `GET /api/projects/:id/activity`
- `GET /api/projects/users`
- `POST /api/projects/:id/members`
- `PUT /api/projects/:id/members/:userId`
- `DELETE /api/projects/:id/members/:userId`
- `POST /api/projects/:id/confidential-access/request`
- `GET /api/projects/:id/confidential-access/requests`
- `PATCH /api/projects/:id/confidential-access/requests/:requestId`

### AI
- `POST /api/ai/chat`

## Seed Users (Development)

| Email | Password | Role |
|---|---|---|
| giri.gk@company.com | password123 | Admin |
| giridharan.gk@company.com | password123 | Member |

## Notes

- For implementation details, scripts, and environment specifics, use the module README files linked above.
- Main README is intentionally maintained as a high-level project overview.

## License

MIT
