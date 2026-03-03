from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
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


def _normalize(*parts: str) -> str:
    return " ".join(part.strip().lower() for part in parts if part).strip()


def _iso_after(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


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

    return TaskSuggestion(
        priority=priority,
        due_date=due_date,
        estimated_hours=hours,
        checklist=checklist,
        reason=reason,
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
    return {
        "focus_hours": focus_hours,
        "planned_hours": round(used, 2),
        "today_plan": selected,
        "backlog": backlog,
        "tip": "Start with the first task and avoid context switching every 20 minutes.",
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

    return {
        "summary": f"{done}/{total} tasks completed.",
        "risk_level": risk,
        "signals": signals,
        "recommendations": recommendations,
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

    return {
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

    return {
        "window_days": days,
        "due_task_count": len(due_items),
        "estimated_hours": round(total_estimate, 2),
        "high_priority_due_count": high_count,
        "pressure": pressure,
        "recommendations": recommendations,
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
    return {
        "reply": reply,
        "context_snapshot": context_snapshot,
        "quick_actions": insights["quick_actions"],
    }
