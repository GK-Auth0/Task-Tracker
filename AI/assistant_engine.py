from __future__ import annotations

import os
from urllib import error as url_error
from urllib import parse as url_parse
from urllib import request as url_request
from dataclasses import dataclass
from datetime import date, timedelta
import json
from typing import Any


HIGH_KEYWORDS = {
    "urgent",
    "asap",
    "critical",
    "blocker",
    "security",
    "production",
    "outage",
    "hotfix",
}

MEDIUM_KEYWORDS = {
    "review",
    "follow up",
    "follow-up",
    "refactor",
    "meeting",
    "update",
    "cleanup",
}

ROUTE_LABELS = {
    "/dashboard": "Dashboard",
    "/projects": "Projects",
    "/calendar": "Calendar",
    "/activity": "Activity",
    "/team": "Team",
    "/chat": "Chat",
}

AI_CHAT_PROVIDER = str(os.getenv("AI_CHAT_PROVIDER", "rule-based")).strip().lower()
GEMINI_API_KEY = str(os.getenv("GEMINI_API_KEY", "")).strip()
GEMINI_MODEL = str(os.getenv("GEMINI_MODEL", "gemini-2.0-flash")).strip()
GEMINI_BASE_URL = str(
    os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")
).strip().rstrip("/")
try:
    GEMINI_TIMEOUT_SEC = max(3.0, float(os.getenv("GEMINI_TIMEOUT_SEC", "12")))
except ValueError:
    GEMINI_TIMEOUT_SEC = 12.0


def _normalize(*parts: str) -> str:
    return " ".join(part.strip().lower() for part in parts if part).strip()


def _iso_after(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def _use_gemini() -> bool:
    return AI_CHAT_PROVIDER in {"gemini", "auto"} and bool(GEMINI_API_KEY)


def _safe_priority(value: Any, fallback: str = "Medium") -> str:
    text = str(value or "").strip().lower()
    if text == "high":
        return "High"
    if text == "low":
        return "Low"
    if text == "medium":
        return "Medium"
    return fallback


def _safe_str_list(value: Any, limit: int = 5, fallback: list[str] | None = None) -> list[str]:
    fallback = fallback or []
    if not isinstance(value, list):
        return fallback
    items: list[str] = []
    for item in value:
        text = str(item or "").strip()
        if text:
            items.append(text)
        if len(items) >= limit:
            break
    return items or fallback


def _extract_json_object(text: str) -> dict[str, Any] | None:
    clean = str(text or "").strip()
    if not clean:
        return None
    # Common model format: ```json ... ```
    if "```" in clean:
        clean = clean.replace("```json", "```")
        segments = clean.split("```")
        for segment in segments:
            segment = segment.strip()
            if segment.startswith("{") and segment.endswith("}"):
                clean = segment
                break
    if clean.startswith("{") and clean.endswith("}"):
        try:
            data = json.loads(clean)
            return data if isinstance(data, dict) else None
        except json.JSONDecodeError:
            return None
    start = clean.find("{")
    end = clean.rfind("}")
    if start == -1 or end <= start:
        return None
    try:
        data = json.loads(clean[start : end + 1])
        return data if isinstance(data, dict) else None
    except json.JSONDecodeError:
        return None


def _gemini_text(prompt: str, mode_instruction: str, max_tokens: int = 700) -> str | None:
    if not _use_gemini():
        return None

    payload = {
        "systemInstruction": {
            "parts": [
                {
                    "text": (
                        "You are Task Tracker AI assistant. "
                        "Focus on practical project planning and execution guidance. "
                        "You must return safe, concise, actionable output. "
                        f"{mode_instruction}"
                    )
                }
            ]
        },
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.25, "maxOutputTokens": max_tokens},
    }

    try:
        model_name = url_parse.quote(GEMINI_MODEL, safe="")
        key = url_parse.quote(GEMINI_API_KEY, safe="")
        endpoint = f"{GEMINI_BASE_URL}/models/{model_name}:generateContent?key={key}"
        req = url_request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with url_request.urlopen(req, timeout=GEMINI_TIMEOUT_SEC) as response:
            data = json.loads(response.read().decode("utf-8"))
    except (url_error.URLError, TimeoutError, json.JSONDecodeError, ValueError):
        return None

    candidates = data.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return None
    content = candidates[0].get("content", {})
    parts = content.get("parts", []) if isinstance(content, dict) else []
    if not isinstance(parts, list):
        return None

    texts: list[str] = []
    for part in parts:
        if isinstance(part, dict):
            text = part.get("text")
            if isinstance(text, str) and text.strip():
                texts.append(text.strip())
    if not texts:
        return None
    return "\n".join(texts).strip()


def _gemini_json(prompt: str, max_tokens: int = 700) -> dict[str, Any] | None:
    text = _gemini_text(
        prompt=prompt,
        mode_instruction="Return only a valid JSON object with no markdown.",
        max_tokens=max_tokens,
    )
    if not text:
        return None
    return _extract_json_object(text)


@dataclass
class TaskSuggestion:
    priority: str
    due_date: str
    estimated_hours: float
    checklist: list[str]
    reason: str

    def to_dict(self) -> dict[str, Any]:
        return {
            "priority": self.priority,
            "due_date": self.due_date,
            "estimated_hours": self.estimated_hours,
            "checklist": self.checklist,
            "reason": self.reason,
        }


def suggest_task(title: str, description: str) -> TaskSuggestion:
    text = _normalize(title, description)
    score = 0

    for keyword in HIGH_KEYWORDS:
        if keyword in text:
            score += 2
    for keyword in MEDIUM_KEYWORDS:
        if keyword in text:
            score += 1

    if "today" in text:
        score += 2
    elif "tomorrow" in text:
        score += 1
    elif "this week" in text:
        score += 1

    if score >= 4:
        priority = "High"
        due_date = _iso_after(1)
        hours = 4.0
        reason = "Urgency signals detected; short deadline recommended."
    elif score >= 2:
        priority = "Medium"
        due_date = _iso_after(3)
        hours = 2.5
        reason = "Moderate urgency; suggest near-term completion."
    else:
        priority = "Low"
        due_date = _iso_after(7)
        hours = 1.5
        reason = "Routine item; keep priority low unless dependencies change."

    checklist = [
        "Clarify expected outcome",
        "Implement the core work",
        "Self-review before marking done",
    ]
    if "bug" in text or "fix" in text:
        checklist.insert(1, "Reproduce issue and verify root cause")
    if "api" in text:
        checklist.append("Validate API response and error handling")

    fallback = TaskSuggestion(
        priority=priority,
        due_date=due_date,
        estimated_hours=hours,
        checklist=checklist,
        reason=reason,
    )

    ai_result = _gemini_json(
        (
            "Generate task suggestion for Task Tracker. "
            "Return JSON with keys: priority, due_date, estimated_hours, checklist, reason.\n"
            f"title={title}\n"
            f"description={description}\n"
            "Rules: priority must be High/Medium/Low; due_date in YYYY-MM-DD; "
            "estimated_hours should be realistic (0.5-16). checklist max 5 items."
        ),
        max_tokens=450,
    )
    if not ai_result:
        return fallback
    try:
        estimated_hours = float(ai_result.get("estimated_hours", fallback.estimated_hours))
    except (TypeError, ValueError):
        estimated_hours = fallback.estimated_hours

    return TaskSuggestion(
        priority=_safe_priority(ai_result.get("priority"), fallback.priority),
        due_date=_safe_date(ai_result.get("due_date"), 3),
        estimated_hours=max(0.5, min(16.0, estimated_hours)),
        checklist=_safe_str_list(ai_result.get("checklist"), limit=5, fallback=fallback.checklist),
        reason=str(ai_result.get("reason", fallback.reason)).strip() or fallback.reason,
    )


def plan_day(tasks: list[dict[str, Any]], focus_hours: float = 6.0) -> dict[str, Any]:
    def rank(task: dict[str, Any]) -> tuple[int, str]:
        priority = str(task.get("priority", "Medium")).lower()
        points = {"high": 3, "medium": 2, "low": 1}.get(priority, 2)
        due = str(task.get("due_date", "9999-12-31"))
        return (-points, due)

    ordered = sorted(tasks, key=rank)
    selected: list[dict[str, Any]] = []
    used = 0.0

    for task in ordered:
        estimate = float(task.get("estimated_hours", 1.0))
        if used + estimate > focus_hours and selected:
            continue
        selected.append(task)
        used += estimate
        if used >= focus_hours:
            break

    backlog = [t for t in ordered if t not in selected]
    fallback = {
        "focus_hours": focus_hours,
        "planned_hours": round(used, 2),
        "today_plan": selected,
        "backlog": backlog,
        "tip": "Start with the first task and avoid context switching every 20 minutes.",
    }

    ai_result = _gemini_json(
        (
            "Create a daily execution plan for Task Tracker.\n"
            "Return JSON with keys: focus_hours, planned_hours, today_plan, backlog, tip.\n"
            "today_plan/backlog must be arrays of task objects from input list.\n"
            f"focus_hours={focus_hours}\n"
            f"tasks={json.dumps(tasks)[:12000]}"
        ),
        max_tokens=650,
    )
    if not ai_result:
        return fallback

    today_plan = ai_result.get("today_plan")
    backlog_val = ai_result.get("backlog")
    if not isinstance(today_plan, list) or not isinstance(backlog_val, list):
        return fallback
    try:
        planned_hours = float(ai_result.get("planned_hours", fallback["planned_hours"]))
        out_focus_hours = float(ai_result.get("focus_hours", focus_hours))
    except (TypeError, ValueError):
        return fallback
    tip = str(ai_result.get("tip", fallback["tip"])).strip() or fallback["tip"]

    return {
        "focus_hours": max(1.0, min(12.0, out_focus_hours)),
        "planned_hours": max(0.0, min(24.0, round(planned_hours, 2))),
        "today_plan": today_plan[:20],
        "backlog": backlog_val[:50],
        "tip": tip,
    }


def project_insights(tasks: list[dict[str, Any]]) -> dict[str, Any]:
    total = len(tasks)
    if total == 0:
        return {
            "summary": "No tasks yet.",
            "risk_level": "Low",
            "signals": [],
            "recommendations": ["Create tasks with due dates and priorities."],
        }

    overdue = 0
    high_open = 0
    done = 0
    today = date.today().isoformat()

    for task in tasks:
        status = str(task.get("status", "")).lower()
        priority = str(task.get("priority", "")).lower()
        due = str(task.get("due_date", ""))
        is_done = status in {"done", "completed"}
        if is_done:
            done += 1
        if due and not is_done and due < today:
            overdue += 1
        if not is_done and priority == "high":
            high_open += 1

    completion_rate = round((done / total) * 100, 1)
    risk_points = overdue * 2 + high_open
    if risk_points >= 6:
        risk = "High"
    elif risk_points >= 3:
        risk = "Medium"
    else:
        risk = "Low"

    signals = []
    if overdue:
        signals.append(f"{overdue} overdue tasks.")
    if high_open:
        signals.append(f"{high_open} high-priority tasks still open.")
    signals.append(f"Completion rate is {completion_rate}%.")

    recommendations = [
        "Close one high-priority task before starting new work.",
        "Move unclear tasks into a separate review list.",
        "Set realistic due dates for tasks with no timeline.",
    ]

    fallback = {
        "summary": f"{done}/{total} tasks completed.",
        "risk_level": risk,
        "signals": signals,
        "recommendations": recommendations,
    }

    ai_result = _gemini_json(
        (
            "Generate project insights for Task Tracker.\n"
            "Return JSON with keys: summary, risk_level, signals, recommendations.\n"
            "risk_level must be High/Medium/Low and aligned to open/overdue/high-priority tasks.\n"
            f"tasks={json.dumps(tasks)[:12000]}"
        ),
        max_tokens=500,
    )
    if not ai_result:
        return fallback

    return {
        "summary": str(ai_result.get("summary", fallback["summary"])).strip() or fallback["summary"],
        "risk_level": _safe_priority(ai_result.get("risk_level"), fallback["risk_level"]),
        "signals": _safe_str_list(ai_result.get("signals"), limit=5, fallback=fallback["signals"]),
        "recommendations": _safe_str_list(
            ai_result.get("recommendations"),
            limit=5,
            fallback=fallback["recommendations"],
        ),
    }


def _safe_date(value: Any, fallback_days: int = 3650) -> str:
    text = str(value or "").strip()
    if len(text) >= 10:
        text = text[:10]
    try:
        date.fromisoformat(text)
        return text
    except ValueError:
        return _iso_after(fallback_days)


def _priority_points(priority: Any) -> int:
    value = str(priority or "").lower().strip()
    return {"high": 3, "medium": 2, "low": 1}.get(value, 2)


def _pending_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        task
        for task in tasks
        if str(task.get("status", "")).lower() not in {"done", "completed"}
    ]


def _route_name(route_context: str) -> str:
    for prefix, label in ROUTE_LABELS.items():
        if route_context.startswith(prefix):
            return label
    return "Workspace"


def _top_tasks(tasks: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    ordered = sorted(
        _pending_tasks(tasks),
        key=lambda task: (
            -_priority_points(task.get("priority")),
            _safe_date(task.get("due_date")),
            str(task.get("title", "")).lower(),
        ),
    )
    return ordered[:limit]


def auto_insights(
    route_context: str,
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    projects = projects or []
    insights = project_insights(tasks)
    top = _top_tasks(tasks, 3)
    due_soon = 0
    today = date.today()

    for task in _pending_tasks(tasks):
        due = str(task.get("due_date", "")).strip()
        if not due:
            continue
        try:
            due_date = date.fromisoformat(due[:10])
        except ValueError:
            continue
        if 0 <= (due_date - today).days <= 2:
            due_soon += 1

    card_lines = [
        f"{_route_name(route_context)} focus: {insights['risk_level']} risk",
        f"Due in 48h: {due_soon} task(s)",
        f"Open high-priority: {sum(1 for t in _pending_tasks(tasks) if _priority_points(t.get('priority')) == 3)}",
    ]
    if projects:
        active_projects = sum(
            1
            for project in projects
            if str(project.get("status", "")).lower() in {"active", "in progress"}
        )
        card_lines.append(f"Active projects: {active_projects}/{len(projects)}")

    quick_actions = [
        "What should I do first today?",
        "Show top risks in my current page",
        "Give me a 30-minute focus plan",
    ]

    fallback = {
        "summary": insights["summary"],
        "risk_level": insights["risk_level"],
        "insights": insights["signals"][:3],
        "recommendations": insights["recommendations"][:3],
        "priority_tasks": [
            {
                "title": str(task.get("title", "Untitled task")),
                "priority": str(task.get("priority", "Medium")),
                "due_date": str(task.get("due_date", "")),
            }
            for task in top
        ],
        "snapshot_lines": card_lines[:4],
        "quick_actions": quick_actions,
    }

    ai_result = _gemini_json(
        (
            "Generate route-aware insights for Task Tracker dashboard.\n"
            "Return JSON with keys: summary, risk_level, insights, recommendations, "
            "priority_tasks, snapshot_lines, quick_actions.\n"
            f"route_context={route_context}\n"
            f"tasks={json.dumps(tasks)[:12000]}\n"
            f"projects={json.dumps(projects)[:6000]}"
        ),
        max_tokens=700,
    )
    if not ai_result:
        return fallback

    raw_priority_tasks = ai_result.get("priority_tasks")
    priority_tasks: list[dict[str, Any]] = []
    if isinstance(raw_priority_tasks, list):
        for item in raw_priority_tasks[:5]:
            if not isinstance(item, dict):
                continue
            priority_tasks.append(
                {
                    "title": str(item.get("title", "Untitled task")).strip() or "Untitled task",
                    "priority": _safe_priority(item.get("priority"), "Medium"),
                    "due_date": str(item.get("due_date", "")).strip(),
                }
            )

    return {
        "summary": str(ai_result.get("summary", fallback["summary"])).strip() or fallback["summary"],
        "risk_level": _safe_priority(ai_result.get("risk_level"), fallback["risk_level"]),
        "insights": _safe_str_list(ai_result.get("insights"), limit=4, fallback=fallback["insights"]),
        "recommendations": _safe_str_list(
            ai_result.get("recommendations"),
            limit=4,
            fallback=fallback["recommendations"],
        ),
        "priority_tasks": priority_tasks or fallback["priority_tasks"],
        "snapshot_lines": _safe_str_list(
            ai_result.get("snapshot_lines"),
            limit=4,
            fallback=fallback["snapshot_lines"],
        ),
        "quick_actions": _safe_str_list(
            ai_result.get("quick_actions"),
            limit=4,
            fallback=fallback["quick_actions"],
        ),
    }


def workload_forecast(
    tasks: list[dict[str, Any]],
    days: int = 7,
) -> dict[str, Any]:
    days = max(1, min(days, 30))
    today = date.today()
    end = today + timedelta(days=days)
    pending = _pending_tasks(tasks)

    due_items: list[dict[str, Any]] = []
    for task in pending:
        due = str(task.get("due_date", "")).strip()
        if not due:
            continue
        try:
            due_date = date.fromisoformat(due[:10])
        except ValueError:
            continue
        if today <= due_date <= end:
            due_items.append(task)

    total_estimate = 0.0
    for task in due_items:
        total_estimate += float(task.get("estimated_hours", 1.5))

    high_count = sum(1 for task in due_items if _priority_points(task.get("priority")) == 3)
    pressure = "Low"
    if high_count >= 4 or total_estimate >= 18:
        pressure = "High"
    elif high_count >= 2 or total_estimate >= 10:
        pressure = "Medium"

    recommendations = [
        "Reserve one block for high-priority tasks each day.",
        "Move low-impact tasks past peak days.",
        "Add estimates to tasks missing effort values.",
    ]

    fallback = {
        "window_days": days,
        "due_task_count": len(due_items),
        "estimated_hours": round(total_estimate, 2),
        "high_priority_due_count": high_count,
        "pressure": pressure,
        "recommendations": recommendations,
    }

    ai_result = _gemini_json(
        (
            "Forecast workload for Task Tracker.\n"
            "Return JSON with keys: window_days, due_task_count, estimated_hours, "
            "high_priority_due_count, pressure, recommendations.\n"
            "pressure must be High/Medium/Low.\n"
            f"days={days}\n"
            f"tasks={json.dumps(tasks)[:12000]}"
        ),
        max_tokens=450,
    )
    if not ai_result:
        return fallback
    try:
        out_days = int(ai_result.get("window_days", fallback["window_days"]))
        due_count = int(ai_result.get("due_task_count", fallback["due_task_count"]))
        high_due = int(ai_result.get("high_priority_due_count", fallback["high_priority_due_count"]))
        est_hours = float(ai_result.get("estimated_hours", fallback["estimated_hours"]))
    except (TypeError, ValueError):
        return fallback

    return {
        "window_days": max(1, min(30, out_days)),
        "due_task_count": max(0, due_count),
        "estimated_hours": max(0.0, round(est_hours, 2)),
        "high_priority_due_count": max(0, high_due),
        "pressure": _safe_priority(ai_result.get("pressure"), fallback["pressure"]),
        "recommendations": _safe_str_list(
            ai_result.get("recommendations"),
            limit=5,
            fallback=fallback["recommendations"],
        ),
    }


def assistant_chat(
    message: str,
    route_context: str,
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]] | None = None,
    response_mode: str = "balanced",
) -> dict[str, Any]:
    projects = projects or []
    clean_message = str(message or "").strip()
    lowered = clean_message.lower()
    insights = auto_insights(route_context, tasks, projects)
    top = insights["priority_tasks"]

    if any(word in lowered for word in {"risk", "blocker", "issue"}):
        primary = f"Current risk is {insights['risk_level']}. Main signals: " + "; ".join(
            insights["insights"][:2] or ["No major risk signals found."]
        )
    elif any(word in lowered for word in {"plan", "today", "focus", "priorit"}):
        focus_titles = ", ".join(item["title"] for item in top[:2]) or "No pending tasks"
        primary = f"Start with: {focus_titles}."
    elif any(word in lowered for word in {"calendar", "schedule", "due"}):
        forecast = workload_forecast(tasks, 7)
        primary = (
            f"Next 7 days: {forecast['due_task_count']} due task(s), "
            f"{forecast['estimated_hours']} estimated hours, "
            f"pressure {forecast['pressure']}."
        )
    else:
        primary = (
            f"{_route_name(route_context)} summary: {insights['summary']} "
            f"Risk is {insights['risk_level']}."
        )

    next_steps = [
        "Complete one high-priority task before opening new work.",
        "Use 25-30 minute focus slots for top pending tasks.",
        "Review due dates and remove unrealistic deadlines.",
    ]

    if response_mode == "concise":
        reply = primary
    elif response_mode == "detailed":
        detailed = [
            primary,
            "Top tasks now: " + ", ".join(item["title"] for item in top) if top else "Top tasks now: none",
            "Recommended next steps:",
            "1. " + next_steps[0],
            "2. " + next_steps[1],
            "3. " + next_steps[2],
        ]
        reply = "\n".join(detailed)
    else:
        reply = primary + " Next: " + " ".join(next_steps[:2])

    context_snapshot = " | ".join(insights["snapshot_lines"])
    gemini_reply = _generate_gemini_reply(
        message=clean_message,
        route_context=route_context,
        response_mode=response_mode,
        insights=insights,
        tasks=tasks,
        projects=projects,
    )
    if gemini_reply:
        reply = gemini_reply

    return {
        "reply": reply,
        "context_snapshot": context_snapshot,
        "quick_actions": insights["quick_actions"],
    }


def _generate_gemini_reply(
    message: str,
    route_context: str,
    response_mode: str,
    insights: dict[str, Any],
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]],
) -> str | None:
    if not message:
        return None

    mode_instruction = {
        "concise": "Keep response under 80 words.",
        "balanced": "Use medium length with actionable steps.",
        "detailed": "Provide detailed guidance with numbered steps.",
    }.get(response_mode, "Use medium length with actionable steps.")

    top_tasks = _top_tasks(tasks, 5)
    task_lines = []
    for task in top_tasks:
        task_lines.append(
            f"- {str(task.get('title', 'Untitled'))} | {str(task.get('priority', 'Medium'))} | "
            f"due {str(task.get('due_date', 'n/a'))} | {str(task.get('status', 'n/a'))}"
        )
    tasks_block = "\n".join(task_lines) if task_lines else "- No pending tasks available"

    project_preview = ", ".join(str(p.get("name", "Untitled")) for p in projects[:5]) or "None"
    prompt = (
        f"Route: {route_context or '/dashboard'}\n"
        f"Risk level: {insights.get('risk_level', 'Unknown')}\n"
        f"Signals: {', '.join(insights.get('insights', [])[:3]) or 'None'}\n"
        f"Top tasks:\n{tasks_block}\n"
        f"Projects: {project_preview}\n"
        f"User message: {message}\n"
        "Respond as a task management assistant. Give practical, safe guidance only."
    )

    return _gemini_text(prompt=prompt, mode_instruction=mode_instruction, max_tokens=700)
