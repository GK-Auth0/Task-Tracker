export enum TaskPriority {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High"
}

export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  READY_FOR_QA = "Ready for QA",
  IN_QA = "In QA",
  BLOCKED = "Blocked",
  DONE = "Done"
}

export enum TaskLabels {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
  BUG = "BUG",
  FEATURE = "FEATURE",
  ENHANCEMENT = "ENHANCEMENT",
  DOCUMENTATION = "DOCUMENTATION",
  TESTING = "TESTING",
  REFACTOR = "REFACTOR"
}

export enum PullRequestStatus {
  OPEN = "open",
  MERGED = "merged",
  CLOSED = "closed"
}

export enum AuditAction {
  CREATED = "created",
  UPDATED = "updated",
  DELETED = "deleted",
  STATUS_CHANGED = "status_changed",
  ASSIGNED = "assigned",
  UNASSIGNED = "unassigned"
}

export enum EntityType {
  TASK = "task",
  PROJECT = "project",
  USER = "user"
}

export enum UserRole {
  ADMIN = "Admin",
  MEMBER = "Member",
  VIEWER = "Viewer"
}

export enum ProjectRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
  VIEWER = "viewer"
}

export enum ConfidentialAccessState {
  NONE = "none",
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export enum ProjectStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export enum ProjectPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}
