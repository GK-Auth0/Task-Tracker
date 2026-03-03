# Task Tracker AI Assistant (Separate Python Service)

This is a standalone Python helper service for simple, practical AI assistance.
It runs separately from `Backend` and `UI`.

## Features

1. `suggest-task`
   - Suggests priority, due date, estimate, and checklist from task text.
2. `plan-day`
   - Creates a focused daily plan from your task list and available hours.
3. `project-insights`
   - Gives risk level, warning signals, and actionable recommendations.
4. `auto-insights`
   - Returns page-aware insights, top priority tasks, and quick chat actions.
5. `workload-forecast`
   - Forecasts near-term workload pressure from due tasks and estimated effort.
6. `chat-context`
   - Context-aware chat response based on current page, tasks, and projects.
7. `metrics`
   - Lightweight runtime monitoring (uptime, request count, errors, endpoint latency).

## Run

```bash
cd AI
python3 assistant_server.py
```

Default URL: `http://127.0.0.1:8787`

Optional env vars:

- `AI_ASSISTANT_HOST` (default `127.0.0.1` in dev, `0.0.0.0` in production)
- `AI_ASSISTANT_PORT` (fallback when `PORT` is not set)
- `PORT` (Render sets this automatically)
- `AI_ENV` / `NODE_ENV` (`production` for deployed environments)
- `AI_MAX_BODY_BYTES` (default `1048576`)
- `AI_ALLOWED_ORIGINS` (comma-separated origins, use `*` for open CORS)
- `AI_API_KEY` (optional; if set, POST endpoints require `X-API-Key`)

## Endpoints

### 1) Health check

```bash
curl http://127.0.0.1:8787/health
```

### 1a) Readiness check

```bash
curl http://127.0.0.1:8787/ready
```

### 1b) Metrics

```bash
curl http://127.0.0.1:8787/metrics
```

### 2) Suggest task fields

```bash
curl -X POST http://127.0.0.1:8787/suggest-task \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix urgent production API bug",
    "description": "Users cannot submit forms today"
  }'
```

### 3) Plan day

```bash
curl -X POST http://127.0.0.1:8787/plan-day \
  -H "Content-Type: application/json" \
  -d '{
    "focus_hours": 6,
    "tasks": [
      {"title":"Fix API bug","priority":"High","due_date":"2026-03-03","estimated_hours":3},
      {"title":"Write docs","priority":"Low","due_date":"2026-03-07","estimated_hours":1.5},
      {"title":"Code review","priority":"Medium","due_date":"2026-03-04","estimated_hours":2}
    ]
  }'
```

### 4) Project insights

```bash
curl -X POST http://127.0.0.1:8787/project-insights \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-03-01"},
      {"title":"Write docs","priority":"Low","status":"Done","due_date":"2026-03-07"}
    ]
  }'
```

### 5) Auto insights for current page

```bash
curl -X POST http://127.0.0.1:8787/auto-insights \
  -H "Content-Type: application/json" \
  -d '{
    "route_context": "/projects",
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-03-03"},
      {"title":"Write docs","priority":"Low","status":"Done","due_date":"2026-03-07"}
    ],
    "projects": [
      {"name":"Task Tracker","status":"Active"}
    ]
  }'
```

### 6) Workload forecast

```bash
curl -X POST http://127.0.0.1:8787/workload-forecast \
  -H "Content-Type: application/json" \
  -d '{
    "days": 7,
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-03-03","estimated_hours":4},
      {"title":"Write docs","priority":"Low","status":"To Do","due_date":"2026-03-06","estimated_hours":2}
    ]
  }'
```

### 7) Context-aware chat

```bash
curl -X POST http://127.0.0.1:8787/chat-context \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I focus on first?",
    "route_context": "/dashboard",
    "response_mode": "balanced",
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-03-03","estimated_hours":4},
      {"title":"Write docs","priority":"Low","status":"To Do","due_date":"2026-03-06","estimated_hours":2}
    ],
    "projects": [
      {"name":"Task Tracker","status":"Active"}
    ]
  }'
```

## Notes

- No external AI/API key required.
- Uses rule-based logic for speed and easy local use.
- You can connect UI/Backend to this service later via HTTP calls.
- Existing endpoints are preserved, so current behavior is not broken.
- `/metrics` uses in-memory counters and resets when the AI service restarts.

## Render deployment

1. Create a Python web service for `AI/`.
2. Build command:

```bash
cd AI && pip install -r requirements.txt
```

3. Start command:

```bash
cd AI && python assistant_server.py
```

4. Set env vars:
- `AI_ENV=production`
- `AI_ALLOWED_ORIGINS=https://your-frontend-domain`
- `AI_API_KEY=<optional shared secret>`
