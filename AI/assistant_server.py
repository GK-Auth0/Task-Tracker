from __future__ import annotations

import json
import os
import signal
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from time import perf_counter
from typing import Any
from urllib.parse import urlsplit

from assistant_engine import (
    assistant_chat,
    auto_insights,
    plan_day,
    project_insights,
    suggest_task,
    workload_forecast,
)

METRICS_LOCK = Lock()
METRICS: dict[str, Any] = {
    "started_at": datetime.now(timezone.utc).isoformat(),
    "requests_total": 0,
    "errors_total": 0,
    "endpoints": {},
}

APP_ENV = str(os.getenv("AI_ENV") or os.getenv("NODE_ENV") or "development").lower()
IS_PRODUCTION = APP_ENV == "production"
MAX_BODY_BYTES = max(1024, int(os.getenv("AI_MAX_BODY_BYTES", "1048576")))
API_KEY = str(os.getenv("AI_API_KEY", "")).strip()
ALLOWED_ORIGINS_RAW = str(
    os.getenv("AI_ALLOWED_ORIGINS", "*" if not IS_PRODUCTION else "")
).strip()
ALLOWED_ORIGINS = [item.strip() for item in ALLOWED_ORIGINS_RAW.split(",") if item.strip()]
ALLOW_ANY_ORIGIN = "*" in ALLOWED_ORIGINS


def _is_origin_allowed(origin: str | None) -> bool:
    if not origin:
        return True
    if ALLOW_ANY_ORIGIN:
        return True
    return origin in ALLOWED_ORIGINS


class SafeThreadingHTTPServer(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 128


class Handler(BaseHTTPRequestHandler):
    server_version = "TaskTrackerAIAssistant/1.0"
    protocol_version = "HTTP/1.1"

    def log_message(self, format: str, *args: Any) -> None:  # noqa: A003
        if IS_PRODUCTION:
            return
        super().log_message(format, *args)

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        origin = self.headers.get("Origin")
        allow_origin = "*"
        if not ALLOW_ANY_ORIGIN and origin and _is_origin_allowed(origin):
            allow_origin = origin
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", allow_origin)
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Vary", "Origin")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0") or "0")
        if content_length <= 0:
            return {}
        if content_length > MAX_BODY_BYTES:
            raise ValueError(f"Payload too large. Max {MAX_BODY_BYTES} bytes.")
        raw = self.rfile.read(content_length).decode("utf-8")
        if not raw.strip():
            return {}
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object.")
        return data

    def _require_api_key(self) -> bool:
        if not API_KEY:
            return True
        provided = (
            self.headers.get("X-API-Key")
            or self.headers.get("x-api-key")
            or ""
        ).strip()
        return provided == API_KEY

    def _path(self) -> str:
        return urlsplit(self.path).path

    def _record_metric(self, path: str, status: int, duration_ms: float) -> None:
        with METRICS_LOCK:
            METRICS["requests_total"] += 1
            if status >= 400:
                METRICS["errors_total"] += 1

            endpoint = METRICS["endpoints"].setdefault(
                path,
                {
                    "count": 0,
                    "errors": 0,
                    "avg_ms": 0.0,
                    "last_status": 200,
                },
            )
            endpoint["count"] += 1
            if status >= 400:
                endpoint["errors"] += 1
            endpoint["last_status"] = status
            endpoint["avg_ms"] = round(
                ((endpoint["avg_ms"] * (endpoint["count"] - 1)) + duration_ms)
                / endpoint["count"],
                2,
            )

    def _send_json_timed(
        self,
        status: int,
        payload: dict[str, Any],
        path: str,
        started_at: float,
    ) -> None:
        self._send_json(status, payload)
        self._record_metric(path, status, (perf_counter() - started_at) * 1000)

    def _metrics_snapshot(self) -> dict[str, Any]:
        with METRICS_LOCK:
            started_iso = METRICS["started_at"]
            started_dt = datetime.fromisoformat(started_iso)
            uptime = int((datetime.now(timezone.utc) - started_dt).total_seconds())
            return {
                "started_at": started_iso,
                "uptime_seconds": max(0, uptime),
                "requests_total": METRICS["requests_total"],
                "errors_total": METRICS["errors_total"],
                "endpoints": dict(METRICS["endpoints"]),
            }

    def do_OPTIONS(self) -> None:  # noqa: N802
        started = perf_counter()
        path = self._path()
        if not _is_origin_allowed(self.headers.get("Origin")):
            self._send_json_timed(403, {"error": "Origin not allowed"}, path, started)
            return
        self._send_json_timed(200, {"ok": True}, path, started)

    def do_GET(self) -> None:  # noqa: N802
        started = perf_counter()
        path = self._path()
        if not _is_origin_allowed(self.headers.get("Origin")):
            self._send_json_timed(403, {"error": "Origin not allowed"}, path, started)
            return

        if path == "/health":
            self._send_json_timed(
                200,
                {
                    "ok": True,
                    "service": "ai-assistant",
                    "env": APP_ENV,
                    "features": [
                        "suggest-task",
                        "plan-day",
                        "project-insights",
                        "auto-insights",
                        "workload-forecast",
                        "chat-context",
                    ],
                },
                path,
                started,
            )
            return
        if path == "/ready":
            self._send_json_timed(
                200,
                {"ok": True, "service": "ai-assistant", "status": "ready"},
                path,
                started,
            )
            return
        if path == "/metrics":
            self._send_json_timed(
                200,
                {"ok": True, "service": "ai-assistant", "metrics": self._metrics_snapshot()},
                path,
                started,
            )
            return
        self._send_json_timed(404, {"error": "Not found"}, path, started)

    def do_POST(self) -> None:  # noqa: N802
        started = perf_counter()
        path = self._path()
        if not _is_origin_allowed(self.headers.get("Origin")):
            self._send_json_timed(403, {"error": "Origin not allowed"}, path, started)
            return
        if not self._require_api_key():
            self._send_json_timed(401, {"error": "Invalid API key"}, path, started)
            return

        try:
            payload = self._read_json()
        except Exception as exc:  # broad for robust API errors
            self._send_json_timed(
                400,
                {"error": f"Invalid JSON: {exc}"},
                path,
                started,
            )
            return

        if path == "/suggest-task":
            title = str(payload.get("title", "")).strip()
            description = str(payload.get("description", "")).strip()
            if not title:
                self._send_json_timed(
                    400,
                    {"error": "Field 'title' is required."},
                    path,
                    started,
                )
                return
            result = suggest_task(title, description).to_dict()
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                path,
                started,
            )
            return

        if path == "/plan-day":
            tasks = payload.get("tasks", [])
            focus_hours = float(payload.get("focus_hours", 6.0))
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    path,
                    started,
                )
                return
            result = plan_day(tasks, focus_hours)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                path,
                started,
            )
            return

        if path == "/project-insights":
            tasks = payload.get("tasks", [])
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    path,
                    started,
                )
                return
            result = project_insights(tasks)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                path,
                started,
            )
            return

        if path == "/auto-insights":
            tasks = payload.get("tasks", [])
            projects = payload.get("projects", [])
            route_context = str(payload.get("route_context", "/dashboard"))
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    path,
                    started,
                )
                return
            if not isinstance(projects, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'projects' must be an array."},
                    path,
                    started,
                )
                return
            result = auto_insights(route_context, tasks, projects)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                path,
                started,
            )
            return

        if path == "/workload-forecast":
            tasks = payload.get("tasks", [])
            days = int(payload.get("days", 7))
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    path,
                    started,
                )
                return
            result = workload_forecast(tasks, days)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                path,
                started,
            )
            return

        if path == "/chat-context":
            message = str(payload.get("message", "")).strip()
            route_context = str(payload.get("route_context", "/dashboard"))
            response_mode = str(payload.get("response_mode", "balanced")).lower()
            tasks = payload.get("tasks", [])
            projects = payload.get("projects", [])
            if not message:
                self._send_json_timed(
                    400,
                    {"error": "Field 'message' is required."},
                    path,
                    started,
                )
                return
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    path,
                    started,
                )
                return
            if not isinstance(projects, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'projects' must be an array."},
                    path,
                    started,
                )
                return
            if response_mode not in {"concise", "balanced", "detailed"}:
                response_mode = "balanced"
            result = assistant_chat(
                message=message,
                route_context=route_context,
                tasks=tasks,
                projects=projects,
                response_mode=response_mode,
            )
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                path,
                started,
            )
            return

        self._send_json_timed(404, {"error": "Not found"}, path, started)


def main() -> None:
    host = os.getenv("AI_ASSISTANT_HOST", "0.0.0.0" if IS_PRODUCTION else "127.0.0.1")
    port = int(os.getenv("PORT") or os.getenv("AI_ASSISTANT_PORT") or "8787")
    server = SafeThreadingHTTPServer((host, port), Handler)
    server.timeout = 30

    def _shutdown_handler(signum: int, _frame: Any) -> None:
        print(f"Received signal {signum}; shutting down AI assistant...")
        server.shutdown()

    signal.signal(signal.SIGTERM, _shutdown_handler)
    signal.signal(signal.SIGINT, _shutdown_handler)

    print(f"AI assistant running on http://{host}:{port} (env={APP_ENV})")
    try:
        server.serve_forever()
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
