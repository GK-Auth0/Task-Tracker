# Task Tracker — AI Assistant Service

Standalone Python HTTP service providing rule-based AI assistance with optional Google Gemini enhancement. No external API key required for basic operation.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | Python 3.10+ |
| HTTP server | `BaseHTTPRequestHandler` + `ThreadingHTTPServer` (stdlib only) |
| AI provider | Rule-based (default) or Google Gemini (optional) |
| Dependencies | None for core logic (`requirements.txt` for optional packages) |

---

## Features

| Endpoint | Description |
|----------|-------------|
| `/suggest-task` | Suggests priority, due date, time estimate, and a checklist from task text |
| `/plan-day` | Builds a focused daily plan from a task list and available hours |
| `/project-insights` | Risk assessment, warning signals, and recommendations for a project |
| `/auto-insights` | Page-aware insights, top-priority tasks, and quick chat actions |
| `/workload-forecast` | 7-day workload pressure forecast based on due dates and estimated hours |
| `/chat-context` | Context-aware chat with conversation history support |
| `/health` | Service health (includes provider mode and Gemini config status) |
| `/ready` | Readiness probe |
| `/metrics` | Runtime stats: uptime, request counts, errors, per-endpoint latency |

---

## Project Structure

```
AI/
├── assistant_server.py     # HTTP server, routing, middleware, CORS, auth
├── assistant_engine.py     # Core rule-based logic + Gemini integration
├── requirements.txt        # Optional dependencies (requests for Gemini)
└── README.md
```

---

## Quick Start

```bash
cd AI
python3 assistant_server.py
```

Default URL: `http://127.0.0.1:8787`

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | — | Port (Render sets this automatically) |
| `AI_ASSISTANT_PORT` | `8787` | Fallback port when `PORT` is not set |
| `AI_ASSISTANT_HOST` | `127.0.0.1` (dev) / `0.0.0.0` (prod) | Bind address |
| `AI_ENV` / `NODE_ENV` | `development` | Set to `production` for deployed environments |
| `AI_MAX_BODY_BYTES` | `1048576` (1 MB) | Max request body size |
| `AI_ALLOWED_ORIGINS` | — | Comma-separated CORS origins; use `*` for open |
| `AI_API_KEY` | — | Optional shared secret; if set, POST endpoints require `X-API-Key` header |
| `AI_CHAT_PROVIDER` | `rule-based` | `rule-based`, `gemini`, or `auto` |
| `GEMINI_API_KEY` | — | Required when provider is `gemini` or `auto` |
| `GEMINI_MODEL` | `gemini-2.0-flash` | Gemini model ID |
| `GEMINI_BASE_URL` | `https://generativelanguage.googleapis.com/v1beta` | Gemini endpoint |
| `GEMINI_TIMEOUT_SEC` | `12` | Gemini request timeout |

---

## Gemini Integration

When `GEMINI_API_KEY` is set and `AI_CHAT_PROVIDER` is `gemini` or `auto`, all endpoints use Gemini for richer, more contextual responses. If Gemini is unavailable or times out, every endpoint automatically falls back to the built-in deterministic logic — no errors are surfaced to the caller.

`/health` response includes:
- `chat_provider` — current provider mode
- `gemini_configured` — `true` / `false`

### Free / local model alternative

For stronger AI without paid APIs, use Ollama on the backend side:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:7b
AI_TIMEOUT_MS=25000
```

Recommended open models: `qwen2.5:7b`, `llama3.1:8b`, `mistral:7b`

---

## Endpoint Reference

### Health check

```bash
curl http://127.0.0.1:8787/health
curl http://127.0.0.1:8787/ready
curl http://127.0.0.1:8787/metrics
```

### Suggest task fields

```bash
curl -X POST http://127.0.0.1:8787/suggest-task \
  -H "Content-Type: application/json" \
  -d '{"title": "Fix urgent production API bug", "description": "Users cannot submit forms"}'
```

### Plan day

```bash
curl -X POST http://127.0.0.1:8787/plan-day \
  -H "Content-Type: application/json" \
  -d '{
    "focus_hours": 6,
    "tasks": [
      {"title":"Fix API bug","priority":"High","due_date":"2026-04-20","estimated_hours":3},
      {"title":"Write docs","priority":"Low","due_date":"2026-04-24","estimated_hours":1.5}
    ]
  }'
```

### Project insights

```bash
curl -X POST http://127.0.0.1:8787/project-insights \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-04-18"},
      {"title":"Write docs","priority":"Low","status":"Done","due_date":"2026-04-24"}
    ]
  }'
```

### Auto insights (page-aware)

```bash
curl -X POST http://127.0.0.1:8787/auto-insights \
  -H "Content-Type: application/json" \
  -d '{
    "route_context": "/projects",
    "tasks": [{"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-04-18"}],
    "projects": [{"name":"Task Tracker","status":"Active"}]
  }'
```

### Workload forecast

```bash
curl -X POST http://127.0.0.1:8787/workload-forecast \
  -H "Content-Type: application/json" \
  -d '{
    "days": 7,
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-04-20","estimated_hours":4},
      {"title":"Write docs","priority":"Low","status":"To Do","due_date":"2026-04-23","estimated_hours":2}
    ]
  }'
```

### Context-aware chat (with conversation history)

```bash
curl -X POST http://127.0.0.1:8787/chat-context \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What should I focus on first?",
    "route_context": "/dashboard",
    "response_mode": "balanced",
    "tasks": [
      {"title":"Fix API bug","priority":"High","status":"In Progress","due_date":"2026-04-18","estimated_hours":4}
    ],
    "projects": [{"name":"Task Tracker","status":"Active"}],
    "history": [
      {"role":"user","text":"What should I focus on first?"},
      {"role":"assistant","text":"Start with the overdue API work — highest risk."}
    ]
  }'
```

---

## Caching

Responses are cached in memory with a 20-second TTL (configurable). Cache hit/miss rates appear in `/metrics`. The cache resets on service restart.

---

## Deployment (Render)

Add a Python web service pointing to the `AI/` directory.

**Build command:**
```bash
pip install -r requirements.txt
```

**Start command:**
```bash
python assistant_server.py
```

**Required env vars:**
```
AI_ENV=production
AI_ALLOWED_ORIGINS=https://your-frontend-domain.com
AI_API_KEY=<optional shared secret>
```

If deploying from the repo root with a Render blueprint, set the service `rootDir` to `AI`. The `render.yaml` in the project root already configures this.

---

## Notes

- `/metrics` counters are in-memory and reset on restart.
- Conversation history in `/chat-context` enables natural follow-up questions.
- All endpoints degrade gracefully — rule-based fallback is always available.
