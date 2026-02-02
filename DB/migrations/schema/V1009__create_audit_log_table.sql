-- Audit Log Table for Task and Project Actions
-- Migration: V1009__create_audit_log_table.sql

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('task', 'project')),
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'assigned', 'unassigned')),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_values JSONB,
    new_values JSONB,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);