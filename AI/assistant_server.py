from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from time import perf_counter
from typing import Any

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


class Handler(BaseHTTPRequestHandler):
    server_version = "TaskTrackerAIAssistant/1.0"

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        if content_length <= 0:
            return {}
        raw = self.rfile.read(content_length).decode("utf-8")
        if not raw.strip():
            return {}
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object.")
        return data

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
                "endpoints": METRICS["endpoints"],
            }

    def do_OPTIONS(self) -> None:  # noqa: N802
        started = perf_counter()
        self._send_json_timed(200, {"ok": True}, self.path, started)

    def do_GET(self) -> None:  # noqa: N802
        started = perf_counter()
        if self.path == "/health":
            self._send_json_timed(
                200,
                {
                    "ok": True,
                    "service": "ai-assistant",
                    "features": [
                        "suggest-task",
                        "plan-day",
                        "project-insights",
                        "auto-insights",
                        "workload-forecast",
                        "chat-context",
                    ],
                },
                self.path,
                started,
            )
            return
        if self.path == "/metrics":
            self._send_json_timed(
                200,
                {"ok": True, "service": "ai-assistant", "metrics": self._metrics_snapshot()},
                self.path,
                started,
            )
            return
        self._send_json_timed(404, {"error": "Not found"}, self.path, started)

    def do_POST(self) -> None:  # noqa: N802
        started = perf_counter()
        try:
            payload = self._read_json()
        except Exception as exc:  # broad for robust API errors
            self._send_json_timed(
                400,
                {"error": f"Invalid JSON: {exc}"},
                self.path,
                started,
            )
            return

        if self.path == "/suggest-task":
            title = str(payload.get("title", "")).strip()
            description = str(payload.get("description", "")).strip()
            if not title:
                self._send_json_timed(
                    400,
                    {"error": "Field 'title' is required."},
                    self.path,
                    started,
                )
                return
            result = suggest_task(title, description).to_dict()
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                self.path,
                started,
            )
            return

        if self.path == "/plan-day":
            tasks = payload.get("tasks", [])
            focus_hours = float(payload.get("focus_hours", 6.0))
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    self.path,
                    started,
                )
                return
            result = plan_day(tasks, focus_hours)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                self.path,
                started,
            )
            return

        if self.path == "/project-insights":
            tasks = payload.get("tasks", [])
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    self.path,
                    started,
                )
                return
            result = project_insights(tasks)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                self.path,
                started,
            )
            return

        if self.path == "/auto-insights":
            tasks = payload.get("tasks", [])
            projects = payload.get("projects", [])
            route_context = str(payload.get("route_context", "/dashboard"))
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    self.path,
                    started,
                )
                return
            if not isinstance(projects, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'projects' must be an array."},
                    self.path,
                    started,
                )
                return
            result = auto_insights(route_context, tasks, projects)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                self.path,
                started,
            )
            return

        if self.path == "/workload-forecast":
            tasks = payload.get("tasks", [])
            days = int(payload.get("days", 7))
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    self.path,
                    started,
                )
                return
            result = workload_forecast(tasks, days)
            self._send_json_timed(
                200,
                {"success": True, "data": result},
                self.path,
                started,
            )
            return

        if self.path == "/chat-context":
            message = str(payload.get("message", "")).strip()
            route_context = str(payload.get("route_context", "/dashboard"))
            response_mode = str(payload.get("response_mode", "balanced")).lower()
            tasks = payload.get("tasks", [])
            projects = payload.get("projects", [])
            if not message:
                self._send_json_timed(
                    400,
                    {"error": "Field 'message' is required."},
                    self.path,
                    started,
                )
                return
            if not isinstance(tasks, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'tasks' must be an array."},
                    self.path,
                    started,
                )
                return
            if not isinstance(projects, list):
                self._send_json_timed(
                    400,
                    {"error": "Field 'projects' must be an array."},
                    self.path,
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
                self.path,
                started,
            )
            return

        self._send_json_timed(404, {"error": "Not found"}, self.path, started)


def main() -> None:
    host = os.getenv("AI_ASSISTANT_HOST", "127.0.0.1")
    port = int(os.getenv("AI_ASSISTANT_PORT", "8787"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"AI assistant running on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
