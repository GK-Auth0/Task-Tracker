# Task Tracker Cache

This package provides the Redis-backed cache layer used by the Task Tracker API.

## What Gets Cached

The API currently caches these responses:

- Dashboard summary (`GET /api/dashboard/summary`) per user for 60 seconds
- Dashboard overview (`GET /api/dashboard/overview`) per user + query params for 60 seconds
- Dashboard insights (`GET /api/dashboard/insights`) per user for 60 seconds
- Project stats (`GET /api/projects/:id/stats`) per project for 60 seconds

## Cache Keys

Keys are prefixed and namespaced for easy invalidation:

- `dashboard:summary:{userId}`
- `dashboard:overview:{userId}:{upcomingLimit}:{activityLimit}`
- `dashboard:insights:{userId}`
- `project:stats:{projectId}`

If `REDIS_KEY_PREFIX` is set, it is prepended to all keys.

## Invalidation

Cache is cleared when tasks change:

- Task create/update/delete clears dashboard keys for affected users.
- Task create/update/delete clears project stats for the associated project.
- Project delete clears project stats for that project.

## Environment Variables

These are read by the cache package via `process.env`:

- `REDIS_ENABLED` (true/false)
- `REDIS_URL` (if set, takes precedence)
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_USERNAME`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `REDIS_TLS`
- `REDIS_TLS_REJECT_UNAUTHORIZED`
- `REDIS_KEY_PREFIX`

## Local Development

1. Start Redis (see `DB/docker-compose.yml`).
2. Install dependencies and build:

```bash
cd Cache
npm install
npm run build
```

## Usage (from Backend)

```ts
import { getCache, setCache, deleteCache } from "task-tracker-cache";
```
