# Task Tracker — Frontend

React + TypeScript SPA built with Vite, Tailwind CSS, and Material UI. Covers authentication, project/task management, sprint boards, QA workflows, defect tracking, real-time chat, and an AI assistant sidebar.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Language | TypeScript 5 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 + Material UI 7 |
| Routing | React Router v6 |
| Data fetching | React Query + Axios |
| Icons | Heroicons + MUI icons |
| Testing | Vitest |

---

## Prerequisites

- Node.js 18+
- Yarn
- Backend running on `http://localhost:3000`
- AI service running on `http://127.0.0.1:8787` (optional)

---

## Setup

### 1. Install dependencies

```bash
cd UI
yarn install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_WS_BASE_URL=ws://localhost:3000
VITE_AI_ASSISTANT_URL=http://127.0.0.1:8787
VITE_AI_API_KEY=
VITE_HIDE_AUTH0=false
# VITE_AUTH0_DOMAIN=
# VITE_AUTH0_CLIENT_ID=
# VITE_AUTH0_AUDIENCE=
```

### 3. Start the dev server

```bash
yarn dev
```

App available at `http://localhost:3001`.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Vite dev server with HMR |
| `yarn build` | TypeScript compile + production bundle |
| `yarn preview` | Preview production build locally |
| `yarn test` | Vitest test suite |
| `yarn lint` | ESLint |
| `yarn format` | Prettier |

---

## Project Structure

```
UI/
├── public/                  # Static assets
└── src/
    ├── pages/               # Full-page route components
    ├── components/          # Reusable UI components (grouped by feature)
    │   ├── auth/
    │   ├── tasks/
    │   ├── task-detail/
    │   ├── projects/
    │   ├── sprint/
    │   ├── testcases/
    │   ├── dashboard/
    │   ├── ai/
    │   ├── calendar/
    │   ├── layout/          # Sidebar, header, navigation
    │   ├── preferences/
    │   └── common/
    ├── services/            # Axios API wrappers
    ├── contexts/            # React context providers (auth, etc.)
    ├── hooks/               # Custom React hooks
    ├── types/               # TypeScript interfaces and enums
    ├── utils/               # Shared helpers
    ├── App.tsx              # Router and layout root
    └── main.tsx             # Entry point
```

---

## Pages & Routes

### Authentication

| Route | Page | Description |
|-------|------|-------------|
| `/login` | `Login.tsx` | Email/password login |
| `/register` | `Register.tsx` | New account registration |
| `/otp-verification` | `OtpVerification.tsx` | OTP input after login/register |
| `/forgot-password` | `ForgotPassword.tsx` | Request password reset |
| `/reset-password` | `ResetPassword.tsx` | Reset with token from email |
| `/change-password` | `ChangePassword.tsx` | Change password (authenticated) |
| `/auth/callback` | `AuthCallback.tsx` | Auth0 OAuth callback |

### Core App (Protected)

| Route | Page | Description |
|-------|------|-------------|
| `/` | `Dashboard.tsx` / `DashboardContent.tsx` | Overview: stats, recent activity |
| `/projects` | `Projects.tsx` | Project list and creation |
| `/projects/:id` | `ProjectDetail.tsx` | Project members, files, settings |
| `/tasks` | `Tasks.tsx` | Task list with filters |
| `/tasks/:id` | `TaskDetails.tsx` | Task detail view |
| `/calendar` | `Calendar.tsx` | Due dates and sprint calendar |
| `/analytics` | `Analytics.tsx` | Charts and performance metrics |
| `/activity` | `ActivityLog.tsx` | Audit log and activity history |
| `/chat` | `Chat.tsx` | Real-time group messaging |
| `/settings` | `Settings.tsx` | App and team settings |
| `/profile` | `Profile.tsx` | User profile editing |

### Sprint Management

| Route | Page | Description |
|-------|------|-------------|
| `/sprints` | `SprintBoards.tsx` | Sprint list for a project |
| `/sprints/:id/dev` | `SprintDevBoard.tsx` | Developer kanban board |
| `/sprints/:id/qa` | `SprintQaBoard.tsx` | QA-focused sprint board |

### QA & Test Management

| Route | Page | Description |
|-------|------|-------------|
| `/test-cases` | `TestCases.tsx` | Test case list and filters |
| `/test-cases/create` | `CreateTestCase.tsx` | New test case form |
| `/test-cases/:id` | `TestCaseDetailPage.tsx` | Test case detail |
| `/test-cases/modules/:id` | `TestCaseModuleDetail.tsx` | Module-grouped view |
| `/test-plans` | `TestPlans.tsx` | Test plans list |
| `/test-runs` | `TestRuns.tsx` | Test run execution |
| `/test-reports` | `TestReports.tsx` | Pass/fail reports |
| `/test-traceability` | `TestTraceability.tsx` | Requirement–test mapping |

### Defect Tracking

| Route | Page | Description |
|-------|------|-------------|
| `/defects` | `TestDefects.tsx` | Defect list |
| `/defects/raise` | `RaiseDefect.tsx` | Log new defect |
| `/defects/:id` | `DefectDetailPage.tsx` | Defect details and history |
| `/defect-reports` | `DefectReports.tsx` | Defect analytics |

### Organization & Onboarding

| Route | Page | Description |
|-------|------|-------------|
| `/onboarding` | `OrganizationOnboarding.tsx` | Create or join an organization |

---

## Key Components

| Component | Location | Description |
|-----------|----------|-------------|
| `CreateTaskModal` | `components/tasks/` | Full task creation form with all fields |
| `TaskDetails` | `components/task-detail/` | Task view/edit with subtasks, comments, files |
| `CreateProjectModal` | `components/projects/` | Project creation form |
| `ProjectCard` | `components/projects/` | Project summary card with tooltip |
| `TeamManagement` | `components/` | Member list, role management, invitations |
| `Sidebar` | `components/layout/` | Main navigation sidebar |
| `Layout` | `components/layout/` | Page wrapper with sidebar + header |
| `AuthNavbar` | `components/layout/` | Unauthenticated page header |
| AI sidebar | `components/ai/` | AI assistant panel (suggestions, chat) |

---

## Services (API Layer)

| File | Covers |
|------|--------|
| `auth.ts` | Login, register, OTP, token refresh |
| `taskService.ts` | Task CRUD, comments, files, subtasks |
| `projectService.ts` | Project CRUD, members, files |
| `sprints.ts` | Sprint data and task assignments |
| `testCases.ts` | Test case CRUD |
| `testManagement.ts` | Plans, runs, reports |
| `defects.ts` | Defect lifecycle |
| `dashboard.ts` | Stats, activity |
| `chatService.ts` | Groups and messages |
| `aiAssistant.ts` | Suggest-task, plan-day, insights |
| `aiChat.ts` | Streaming chat context |
| `organization.ts` | Org management |
| `inviteService.ts` | Invitations |
| `search.ts` | Global search |
| `preferences.ts` | User preferences |

All services use Axios and read `VITE_API_BASE_URL` from the environment.

---

## State Management

- **AuthContext** — global auth state (user info, access token, login/logout)
- **React Query** — server state, caching, background refetch
- **Local state** — component-level UI state (modals, forms, filters)

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | (same origin) | Backend REST API base URL |
| `VITE_WS_BASE_URL` | (derived) | WebSocket base URL for chat |
| `VITE_AI_ASSISTANT_URL` | `http://127.0.0.1:8787` | AI service URL |
| `VITE_AI_API_KEY` | — | Optional shared secret for AI service |
| `VITE_HIDE_AUTH0` | `false` | Set `true` to hide Auth0 login/register options |
| `VITE_AUTH0_DOMAIN` | — | Auth0 domain (optional) |
| `VITE_AUTH0_CLIENT_ID` | — | Auth0 client ID (optional) |
| `VITE_AUTH0_AUDIENCE` | — | Auth0 API audience (optional) |

---

## Production Build

```bash
yarn build       # outputs to dist/
yarn preview     # local preview of the dist/ bundle
```

### Production checklist

1. Set `VITE_API_BASE_URL` to your deployed API domain (or configure a reverse proxy for `/api`).
2. Set `VITE_WS_BASE_URL` to `wss://your-api-domain` if not same-origin.
3. Set `VITE_AI_ASSISTANT_URL` (or reverse-proxy `/ai-assistant`).
4. Ensure your backend `ALLOWED_ORIGINS` includes the frontend domain.
5. Set `VITE_HIDE_AUTH0=true` if Auth0 is not configured.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Blank page / network errors | Check `VITE_API_BASE_URL` and that the backend is running |
| WebSocket connection refused | Verify `VITE_WS_BASE_URL` and backend WS support |
| Auth loops / 401s | Clear localStorage, check JWT expiry and refresh token logic |
| Build TypeScript errors | Run `yarn tsc --noEmit` to see full error list |
| CORS errors | Add the frontend URL to backend `ALLOWED_ORIGINS` |
