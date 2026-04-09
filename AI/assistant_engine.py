from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from datetime import date, timedelta
from typing import Any
from urllib import error as url_error
from urllib import parse as url_parse
from urllib import request as url_request


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
    "/ai-monitoring": "AI Monitoring",
}

STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "be",
    "for",
    "from",
    "give",
    "how",
    "i",
    "in",
    "is",
    "it",
    "me",
    "my",
    "of",
    "on",
    "or",
    "show",
    "should",
    "that",
    "the",
    "this",
    "to",
    "what",
    "with",
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


def _tokenize(text: str) -> list[str]:
    return [
        token
        for token in re.findall(r"[a-z0-9]+", str(text or "").lower())
        if token not in STOP_WORDS and len(token) > 1
    ]


def _snippet(text: str, limit: int = 220) -> str:
    clean = " ".join(str(text or "").split()).strip()
    if len(clean) <= limit:
        return clean
    return clean[: limit - 3].rstrip() + "..."


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
                        "Focus on practical project planning, execution, and prioritization. "
                        "Be concrete, cite specific tasks/projects when present, and avoid generic filler. "
                        f"{mode_instruction}"
                    )
                }
            ]
        },
        "contents": [{"role": "user", "parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.35, "maxOutputTokens": max_tokens},
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


def _task_title(task: dict[str, Any]) -> str:
    return str(task.get("title", "Untitled task")).strip() or "Untitled task"


def _task_status(task: dict[str, Any]) -> str:
    return str(task.get("status", "")).strip() or "To Do"


def _task_priority(task: dict[str, Any]) -> str:
    return _safe_priority(task.get("priority"), "Medium")


def _task_due(task: dict[str, Any]) -> str:
    return str(task.get("due_date", "")).strip()


def _task_project_name(task: dict[str, Any]) -> str:
    return str(
        task.get("project_name")
        or task.get("project")
        or task.get("project_title")
        or ""
    ).strip()


def _is_done(task: dict[str, Any]) -> bool:
    return _task_status(task).lower() in {"done", "completed"}


def _estimate_hours(task: dict[str, Any], fallback: float = 1.5) -> float:
    try:
        return max(0.25, min(16.0, float(task.get("estimated_hours", fallback))))
    except (TypeError, ValueError):
        return fallback


def _days_until_due(task: dict[str, Any]) -> int | None:
    due = _task_due(task)
    if not due:
        return None
    try:
        return (date.fromisoformat(due[:10]) - date.today()).days
    except ValueError:
        return None


def _task_age_days(task: dict[str, Any]) -> int:
    updated = str(task.get("updated_at", "")).strip()
    if not updated:
        return 0
    try:
        return max(0, (date.today() - date.fromisoformat(updated[:10])).days)
    except ValueError:
        return 0


def _task_score(task: dict[str, Any]) -> float:
    if _is_done(task):
        return -100.0

    score = float(_priority_points(task.get("priority")) * 10)
    due_days = _days_until_due(task)
    if due_days is None:
        score += 1.0
    elif due_days < 0:
        score += 18.0 + min(6.0, abs(due_days))
    elif due_days == 0:
        score += 14.0
    elif due_days <= 2:
        score += 9.0
    elif due_days <= 7:
        score += 4.0

    status = _task_status(task).lower()
    if status in {"blocked", "at risk"}:
        score += 8.0
    elif status in {"in progress"}:
        score += 4.0

    age_days = _task_age_days(task)
    if age_days >= 7 and status not in {"done", "completed"}:
        score += 2.0

    return round(score, 2)


def _pending_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [task for task in tasks if not _is_done(task)]


def _route_name(route_context: str) -> str:
    for prefix, label in ROUTE_LABELS.items():
        if route_context.startswith(prefix):
            return label
    return "Workspace"


def _top_tasks(tasks: list[dict[str, Any]], limit: int = 3) -> list[dict[str, Any]]:
    ordered = sorted(
        _pending_tasks(tasks),
        key=lambda task: (-_task_score(task), _safe_date(task.get("due_date")), _task_title(task).lower()),
    )
    return ordered[:limit]


def _overdue_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [task for task in _pending_tasks(tasks) if (_days_until_due(task) or 9999) < 0]


def _due_soon_tasks(tasks: list[dict[str, Any]], days: int = 2) -> list[dict[str, Any]]:
    matches: list[dict[str, Any]] = []
    for task in _pending_tasks(tasks):
        due_days = _days_until_due(task)
        if due_days is not None and 0 <= due_days <= days:
            matches.append(task)
    return matches


def _missing_due_date_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [task for task in _pending_tasks(tasks) if not _task_due(task)]


def _stalled_tasks(tasks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        task
        for task in _pending_tasks(tasks)
        if _task_age_days(task) >= 7 and _task_status(task).lower() in {"to do", "in progress"}
    ]


def _compact_task(task: dict[str, Any]) -> dict[str, Any]:
    compact: dict[str, Any] = {
        "title": _task_title(task),
        "priority": _task_priority(task),
        "status": _task_status(task),
        "score": _task_score(task),
    }
    if _task_due(task):
        compact["due_date"] = _task_due(task)
    project_name = _task_project_name(task)
    if project_name:
        compact["project_name"] = project_name
    estimate = task.get("estimated_hours")
    if estimate not in (None, ""):
        compact["estimated_hours"] = _estimate_hours(task)
    return compact


def _compact_project(project: dict[str, Any]) -> dict[str, Any]:
    compact = {
        "name": str(project.get("name", "Untitled project")).strip() or "Untitled project",
        "status": str(project.get("status", "")).strip() or "Unknown",
    }
    priority = str(project.get("priority", "")).strip()
    if priority:
        compact["priority"] = priority
    return compact


def _detect_intent(message: str, route_context: str) -> str:
    lowered = str(message or "").lower()
    if any(term in lowered for term in {"standup", "status update", "daily update"}):
        return "standup"
    if any(term in lowered for term in {"break down", "breakdown", "steps", "subtasks", "checklist"}):
        return "breakdown"
    if any(term in lowered for term in {"risk", "blocker", "issue", "stuck", "at risk"}):
        return "risk"
    if any(term in lowered for term in {"plan my day", "today", "focus", "priorit", "first"}):
        return "prioritize"
    if any(term in lowered for term in {"due", "deadline", "schedule", "calendar", "this week"}):
        return "schedule"
    if any(term in lowered for term in {"summary", "overview", "what's going on", "snapshot"}):
        return "summary"
    if route_context.startswith("/projects"):
        return "project"
    return "summary"


def _select_relevant_tasks(message: str, tasks: list[dict[str, Any]], limit: int = 6) -> list[dict[str, Any]]:
    query_tokens = set(_tokenize(message))
    if not query_tokens:
        return _top_tasks(tasks, limit)

    ranked: list[tuple[float, dict[str, Any]]] = []
    for task in _pending_tasks(tasks):
        haystack = _tokenize(f"{_task_title(task)} {_task_project_name(task)} {_task_status(task)}")
        overlap = len(query_tokens.intersection(haystack))
        score = _task_score(task) + (overlap * 12)
        ranked.append((score, task))

    ranked.sort(key=lambda item: (-item[0], _safe_date(item[1].get("due_date")), _task_title(item[1]).lower()))
    return [task for _, task in ranked[:limit]]


def _task_line(task: dict[str, Any]) -> str:
    bits = [f"{_task_title(task)} ({_task_priority(task)})"]
    due = _task_due(task)
    if due:
        due_days = _days_until_due(task)
        suffix = "overdue" if due_days is not None and due_days < 0 else f"due {due}"
        bits.append(suffix)
    bits.append(_task_status(task))
    project_name = _task_project_name(task)
    if project_name:
        bits.append(project_name)
    return " | ".join(bits)


def _task_breakdown(task: dict[str, Any]) -> list[str]:
    title = _task_title(task).lower()
    steps = [
        "Clarify the concrete outcome and definition of done.",
        "Implement the smallest high-confidence slice first.",
        "Validate the result and update stakeholders.",
    ]
    if any(word in title for word in {"bug", "fix", "error", "issue"}):
        steps = [
            "Reproduce the issue and confirm the scope.",
            "Fix the root cause, not just the visible symptom.",
            "Retest the broken flow and nearby regression paths.",
        ]
    elif any(word in title for word in {"api", "endpoint", "integration"}):
        steps = [
            "Confirm request/response expectations and edge cases.",
            "Implement the API change with error handling.",
            "Test successful, invalid, and failure responses.",
        ]
    elif any(word in title for word in {"doc", "spec", "write", "content"}):
        steps = [
            "Outline the key sections before drafting.",
            "Write the core content with examples and decisions.",
            "Review for clarity and missing assumptions.",
        ]
    elif any(word in title for word in {"design", "ui", "ux"}):
        steps = [
            "Define the user flow and the screen states.",
            "Draft the layout with edge and empty states.",
            "Validate accessibility and responsiveness.",
        ]
    return steps


def _dynamic_quick_actions(route_context: str, tasks: list[dict[str, Any]], projects: list[dict[str, Any]]) -> list[str]:
    top = _top_tasks(tasks, 2)
    overdue = _overdue_tasks(tasks)
    due_soon = _due_soon_tasks(tasks, 3)
    actions: list[str] = []

    if top:
        actions.append(f"What should I do first: {_task_title(top[0])} or the rest?")
        if len(top) > 1:
            actions.append(f"Break down {_task_title(top[1])} into steps")
    if overdue:
        actions.append("Show my overdue recovery plan")
    elif due_soon:
        actions.append("Plan the next 3 days around upcoming deadlines")
    if route_context.startswith("/projects") and projects:
        actions.append("Give me project risks and next owner actions")
    elif route_context.startswith("/calendar"):
        actions.append("Turn this into a realistic weekly schedule")
    else:
        actions.append("Create a short standup update from my current work")

    deduped: list[str] = []
    for action in actions:
        if action not in deduped:
            deduped.append(action)
    return deduped[:4]


def _knowledge_score(item: dict[str, Any], query_tokens: set[str]) -> float:
    title = str(item.get("title", "")).strip()
    content = str(item.get("content", "")).strip()
    haystack_tokens = set(_tokenize(f"{title} {content}"))
    overlap = len(query_tokens.intersection(haystack_tokens))
    score = overlap * 10
    metadata = item.get("metadata", {})
    if isinstance(metadata, dict):
      score += len(query_tokens.intersection(set(_tokenize(" ".join(str(v) for v in metadata.values()))))) * 3
    if str(item.get("type")) == "task":
        score += 2
    if content:
        score += min(5, len(content) / 120)
    return float(score)


def _retrieve_knowledge(
    message: str,
    knowledge: list[dict[str, Any]],
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]],
    limit: int = 4,
) -> list[dict[str, Any]]:
    query_tokens = set(_tokenize(message))
    if not query_tokens:
        query_tokens = set(
            _tokenize(
                " ".join(
                    [_task_title(task) for task in _top_tasks(tasks, 2)]
                    + [str(project.get("name", "")) for project in projects[:2]]
                )
            )
        )

    ranked: list[tuple[float, dict[str, Any]]] = []
    for item in knowledge:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title", "")).strip()
        content = str(item.get("content", "")).strip()
        if not title and not content:
            continue
        score = _knowledge_score(item, query_tokens)
        if score <= 0:
            continue
        ranked.append((score, item))

    ranked.sort(key=lambda entry: -entry[0])
    return [item for _, item in ranked[:limit]]


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
    focus_hours = max(1.0, min(12.0, float(focus_hours or 6.0)))
    ordered = sorted(_pending_tasks(tasks), key=lambda task: (-_task_score(task), _task_title(task).lower()))
    selected: list[dict[str, Any]] = []
    used = 0.0

    for task in ordered:
        estimate = _estimate_hours(task, 1.5)
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
        "today_plan": selected[:10],
        "backlog": backlog[:20],
        "tip": "Start with the highest-score task first and keep one recovery block for interruptions.",
    }

    ai_result = _gemini_json(
        (
            "Create a realistic daily execution plan for Task Tracker.\n"
            "Return JSON with keys: focus_hours, planned_hours, today_plan, backlog, tip.\n"
            "today_plan/backlog must be arrays of task objects from input list.\n"
            f"focus_hours={focus_hours}\n"
            f"tasks={json.dumps([_compact_task(task) for task in tasks])[:12000]}"
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
            "recommendations": ["Create a few tasks with owners, due dates, and priority."],
        }

    pending = _pending_tasks(tasks)
    overdue = _overdue_tasks(tasks)
    high_open = [task for task in pending if _priority_points(task.get("priority")) == 3]
    stalled = _stalled_tasks(tasks)
    missing_due = _missing_due_date_tasks(tasks)
    done = total - len(pending)
    completion_rate = round((done / total) * 100, 1)

    risk_points = len(overdue) * 2 + len(high_open) + len(stalled)
    if risk_points >= 7:
        risk = "High"
    elif risk_points >= 3:
        risk = "Medium"
    else:
        risk = "Low"

    signals: list[str] = []
    if overdue:
        signals.append(f"{len(overdue)} task(s) are overdue.")
    if high_open:
        signals.append(f"{len(high_open)} high-priority task(s) are still open.")
    if stalled:
        signals.append(f"{len(stalled)} task(s) look stalled based on recent updates.")
    if missing_due:
        signals.append(f"{len(missing_due)} open task(s) have no due date.")
    signals.append(f"Completion rate is {completion_rate}%.")

    recommendations = [
        "Close or replan one overdue task before starting new medium-priority work.",
        "Assign realistic due dates to tasks missing deadlines.",
        "Split large or stalled work into smaller next actions.",
    ]

    fallback = {
        "summary": f"{done}/{total} tasks completed, {len(overdue)} overdue, {len(high_open)} high-priority still open.",
        "risk_level": risk,
        "signals": signals[:5],
        "recommendations": recommendations,
    }

    ai_result = _gemini_json(
        (
            "Generate project insights for Task Tracker.\n"
            "Return JSON with keys: summary, risk_level, signals, recommendations.\n"
            "risk_level must be High/Medium/Low and aligned to overdue/high-priority/stalled work.\n"
            f"tasks={json.dumps([_compact_task(task) for task in tasks])[:12000]}"
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


def auto_insights(
    route_context: str,
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    projects = projects or []
    insights = project_insights(tasks)
    top = _top_tasks(tasks, 4)
    overdue = _overdue_tasks(tasks)
    due_soon = _due_soon_tasks(tasks, 2)
    stalled = _stalled_tasks(tasks)

    card_lines = [
        f"{_route_name(route_context)} focus: {insights['risk_level']} risk",
        f"Overdue: {len(overdue)}",
        f"Due in 48h: {len(due_soon)}",
        f"Stalled: {len(stalled)}",
    ]
    if projects:
        active_projects = sum(
            1
            for project in projects
            if str(project.get("status", "")).lower() in {"active", "in progress", "planning"}
        )
        card_lines.append(f"Active projects: {active_projects}/{len(projects)}")

    summary = insights["summary"]
    if top:
        summary = f"{summary} Highest pressure task: {_task_title(top[0])}."

    fallback = {
        "summary": summary,
        "risk_level": insights["risk_level"],
        "insights": insights["signals"][:4],
        "recommendations": insights["recommendations"][:4],
        "priority_tasks": [
            {
                "title": _task_title(task),
                "priority": _task_priority(task),
                "due_date": _task_due(task),
            }
            for task in top
        ],
        "snapshot_lines": card_lines[:4],
        "quick_actions": _dynamic_quick_actions(route_context, tasks, projects),
    }

    ai_result = _gemini_json(
        (
            "Generate route-aware insights for Task Tracker.\n"
            "Return JSON with keys: summary, risk_level, insights, recommendations, "
            "priority_tasks, snapshot_lines, quick_actions.\n"
            f"route_context={route_context}\n"
            f"tasks={json.dumps([_compact_task(task) for task in tasks])[:12000]}\n"
            f"projects={json.dumps([_compact_project(project) for project in projects])[:5000]}"
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
        due = _task_due(task)
        if not due:
            continue
        try:
            due_date = date.fromisoformat(due[:10])
        except ValueError:
            continue
        if today <= due_date <= end:
            due_items.append(task)

    total_estimate = sum(_estimate_hours(task, 1.5) for task in due_items)
    high_count = sum(1 for task in due_items if _priority_points(task.get("priority")) == 3)
    pressure = "Low"
    if high_count >= 4 or total_estimate >= 18:
        pressure = "High"
    elif high_count >= 2 or total_estimate >= 10:
        pressure = "Medium"

    recommendations = [
        "Reserve a protected block for the highest-pressure task each day.",
        "Move low-impact work out of the busiest due-date window.",
        "Add effort estimates where they are still missing.",
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
            f"tasks={json.dumps([_compact_task(task) for task in tasks])[:12000]}"
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


def _rule_based_reply(
    message: str,
    route_context: str,
    response_mode: str,
    insights: dict[str, Any],
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]],
) -> str:
    intent = _detect_intent(message, route_context)
    relevant = _select_relevant_tasks(message, tasks, limit=6)
    top = _top_tasks(tasks, 3)
    overdue = _overdue_tasks(tasks)
    due_soon = _due_soon_tasks(tasks, 7)

    if intent == "prioritize":
        if not top:
            return "You do not have open tasks right now. The best next move is to create or pull in one concrete task with a due date."
        lines = [f"Start with {_task_title(top[0])} because it carries the highest current delivery pressure."]
        if len(top) > 1:
            lines.append(f"Next, move {_task_title(top[1])} once the first task is stable.")
        lines.append(
            "Why: "
            + "; ".join(
                [
                    line
                    for line in [
                        f"{len(overdue)} overdue task(s)" if overdue else "",
                        f"{len(due_soon)} due within 7 days" if due_soon else "",
                        f"route risk is {insights['risk_level'].lower()}",
                    ]
                    if line
                ]
            )
            + "."
        )
        if response_mode == "concise":
            return " ".join(lines[:2])
        lines.append("Suggested sequence:")
        lines.extend([f"1. {_task_title(task)}" for task in top[:3]])
        return "\n".join(lines)

    if intent == "risk":
        lines = [f"Current risk is {insights['risk_level']}."]
        for signal in insights.get("insights", [])[:3]:
            lines.append(f"- {signal}")
        if relevant:
            lines.append("Most relevant work to inspect:")
            lines.extend([f"- {_task_line(task)}" for task in relevant[:3]])
        lines.append("Best mitigation: " + (insights.get("recommendations", ["Reprioritize the most pressured task first."])[0]))
        return "\n".join(lines if response_mode != "concise" else lines[:3])

    if intent == "schedule":
        forecast = workload_forecast(tasks, 7)
        lines = [
            f"In the next {forecast['window_days']} days you have {forecast['due_task_count']} due task(s) and about {forecast['estimated_hours']} planned hours.",
            f"Pressure level is {forecast['pressure']}.",
        ]
        if due_soon:
            lines.append("Closest deadlines:")
            lines.extend([f"- {_task_line(task)}" for task in due_soon[:3]])
        lines.append("Best next move: " + forecast["recommendations"][0])
        return "\n".join(lines if response_mode != "concise" else lines[:2])

    if intent == "standup":
        yesterday = [task for task in tasks if _is_done(task)][:3]
        today_tasks = _top_tasks(tasks, 3)
        blockers = _overdue_tasks(tasks)[:2]
        lines = ["Standup draft:"]
        lines.append(
            "Yesterday: " + (", ".join(_task_title(task) for task in yesterday) if yesterday else "Closed smaller supporting work and kept the board moving.")
        )
        lines.append(
            "Today: " + (", ".join(_task_title(task) for task in today_tasks) if today_tasks else "No active task selected yet.")
        )
        lines.append(
            "Risks: " + (", ".join(_task_title(task) for task in blockers) if blockers else "No critical blockers detected right now.")
        )
        return "\n".join(lines)

    if intent == "breakdown":
        target = relevant[0] if relevant else (top[0] if top else None)
        if not target:
            return "I could not find a concrete open task to break down. Ask me again with the task title and I will turn it into steps."
        steps = _task_breakdown(target)
        lines = [f"Breakdown for {_task_title(target)}:"]
        for index, step in enumerate(steps, start=1):
            lines.append(f"{index}. {step}")
        lines.append("Definition of done: the change is verified and the next owner no longer has ambiguity.")
        return "\n".join(lines)

    if intent == "project":
        project_names = ", ".join(project["name"] for project in projects[:3] if isinstance(project, dict)) or "current workspace"
        lines = [
            f"{_route_name(route_context)} snapshot: {insights['summary']}",
            f"Projects in view: {project_names}.",
        ]
        if top:
            lines.append("Top delivery pressure: " + ", ".join(_task_title(task) for task in top[:2]))
        lines.append("Recommended action: " + insights["recommendations"][0])
        return "\n".join(lines if response_mode != "concise" else lines[:2])

    lines = [
        f"{_route_name(route_context)} summary: {insights['summary']}",
        f"Risk is {insights['risk_level']}.",
    ]
    if top:
        lines.append("Focus next on " + ", ".join(_task_title(task) for task in top[:2]) + ".")
    if insights.get("recommendations"):
        lines.append("Best next move: " + insights["recommendations"][0])
    return "\n".join(lines if response_mode != "concise" else lines[:2])


def assistant_chat(
    message: str,
    route_context: str,
    tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]] | None = None,
    response_mode: str = "balanced",
    history: list[dict[str, Any]] | None = None,
    knowledge: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    projects = projects or []
    history = history or []
    knowledge = knowledge or []
    clean_message = str(message or "").strip()
    insights = auto_insights(route_context, tasks, projects)
    relevant_tasks = _select_relevant_tasks(clean_message, tasks, limit=6)
    relevant_knowledge = _retrieve_knowledge(clean_message, knowledge, tasks, projects)

    reply = _rule_based_reply(
        message=clean_message,
        route_context=route_context,
        response_mode=response_mode,
        insights=insights,
        tasks=tasks,
        projects=projects,
    )

    gemini_reply = _generate_gemini_reply(
        message=clean_message,
        route_context=route_context,
        response_mode=response_mode,
        insights=insights,
        relevant_tasks=relevant_tasks,
        projects=projects,
        history=history,
        knowledge=relevant_knowledge,
    )
    if gemini_reply:
        reply = gemini_reply

    context_snapshot = " | ".join(insights["snapshot_lines"])
    return {
        "reply": reply,
        "context_snapshot": context_snapshot,
        "quick_actions": insights["quick_actions"],
        "intent": _detect_intent(clean_message, route_context),
        "relevant_tasks": [_compact_task(task) for task in relevant_tasks[:4]],
        "sources": [
            {
                "id": item.get("id"),
                "type": item.get("type"),
                "title": str(item.get("title", "Workspace item")).strip() or "Workspace item",
                "snippet": _snippet(str(item.get("content", "")).strip()),
            }
            for item in relevant_knowledge[:4]
        ],
    }


def _generate_gemini_reply(
    message: str,
    route_context: str,
    response_mode: str,
    insights: dict[str, Any],
    relevant_tasks: list[dict[str, Any]],
    projects: list[dict[str, Any]],
    history: list[dict[str, Any]],
    knowledge: list[dict[str, Any]],
) -> str | None:
    if not message:
        return None

    mode_instruction = {
        "concise": "Keep response under 90 words.",
        "balanced": "Use medium length with concrete next steps.",
        "detailed": "Provide detailed guidance with numbered steps and explicit reasoning.",
    }.get(response_mode, "Use medium length with concrete next steps.")

    task_lines = [
        f"- {_task_title(task)} | {_task_priority(task)} | due {_task_due(task) or 'n/a'} | {_task_status(task)}"
        for task in relevant_tasks[:6]
    ]
    project_preview = ", ".join(
        _compact_project(project)["name"] for project in projects[:6] if isinstance(project, dict)
    ) or "None"
    history_block = "\n".join(
        f"{'Assistant' if str(turn.get('role')) == 'assistant' else 'User'}: {str(turn.get('text', '')).strip()}"
        for turn in history[-8:]
        if str(turn.get("text", "")).strip()
    )
    knowledge_block = "\n".join(
        f"- [{str(item.get('type', 'note'))}] {str(item.get('title', 'Workspace item')).strip()}: {_snippet(str(item.get('content', '')).strip(), 260)}"
        for item in knowledge[:4]
        if str(item.get("content", "")).strip()
    )

    prompt = (
        f"Route: {route_context or '/dashboard'}\n"
        f"Detected intent: {_detect_intent(message, route_context)}\n"
        f"Risk level: {insights.get('risk_level', 'Unknown')}\n"
        f"Signals: {', '.join(insights.get('insights', [])[:4]) or 'None'}\n"
        f"Recommendations: {', '.join(insights.get('recommendations', [])[:3]) or 'None'}\n"
        f"Relevant tasks:\n{chr(10).join(task_lines) if task_lines else '- No relevant tasks'}\n"
        f"Projects: {project_preview}\n"
        f"Relevant knowledge:\n{knowledge_block or 'No matching workspace snippets'}\n"
        f"Recent conversation:\n{history_block or 'No prior turns'}\n"
        f"User message: {message}\n"
        "Respond as a hands-on project assistant. Mention concrete tasks and workspace snippets when useful and avoid generic filler."
    )

    return _gemini_text(prompt=prompt, mode_instruction=mode_instruction, max_tokens=700)
