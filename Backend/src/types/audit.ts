export interface AuditLogData {
  entity_type: "task" | "project";
  entity_id: string;
  action: "created" | "updated" | "deleted" | "status_changed" | "assigned" | "unassigned";
  user_id: string;
  old_values?: object;
  new_values?: object;
  changes?: object;
}
