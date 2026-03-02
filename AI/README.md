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

## Run

```bash
cd AI
python3 assistant_server.py
```

Default URL: `http://127.0.0.1:8787`

Optional env vars:

- `AI_ASSISTANT_HOST` (default `127.0.0.1`)
- `AI_ASSISTANT_PORT` (default `8787`)

## Endpoints

### 1) Health check

```bash
curl http://127.0.0.1:8787/health
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

## Notes

- No external AI/API key required.
- Uses rule-based logic for speed and easy local use.
- You can connect UI/Backend to this service later via HTTP calls.
