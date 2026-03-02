from __future__ import annotations

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

from assistant_engine import plan_day, project_insights, suggest_task


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

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send_json(200, {"ok": True})

    def do_GET(self) -> None:  # noqa: N802
        if self.path == "/health":
            self._send_json(200, {"ok": True, "service": "ai-assistant"})
            return
        self._send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        try:
            payload = self._read_json()
        except Exception as exc:  # broad for robust API errors
            self._send_json(400, {"error": f"Invalid JSON: {exc}"})
            return

        if self.path == "/suggest-task":
            title = str(payload.get("title", "")).strip()
            description = str(payload.get("description", "")).strip()
            if not title:
                self._send_json(400, {"error": "Field 'title' is required."})
                return
            result = suggest_task(title, description).to_dict()
            self._send_json(200, {"success": True, "data": result})
            return

        if self.path == "/plan-day":
            tasks = payload.get("tasks", [])
            focus_hours = float(payload.get("focus_hours", 6.0))
            if not isinstance(tasks, list):
                self._send_json(400, {"error": "Field 'tasks' must be an array."})
                return
            result = plan_day(tasks, focus_hours)
            self._send_json(200, {"success": True, "data": result})
            return

        if self.path == "/project-insights":
            tasks = payload.get("tasks", [])
            if not isinstance(tasks, list):
                self._send_json(400, {"error": "Field 'tasks' must be an array."})
                return
            result = project_insights(tasks)
            self._send_json(200, {"success": True, "data": result})
            return

        self._send_json(404, {"error": "Not found"})


def main() -> None:
    host = os.getenv("AI_ASSISTANT_HOST", "127.0.0.1")
    port = int(os.getenv("AI_ASSISTANT_PORT", "8787"))
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"AI assistant running on http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
