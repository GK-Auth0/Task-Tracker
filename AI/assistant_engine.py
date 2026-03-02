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
