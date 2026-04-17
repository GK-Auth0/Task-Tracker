CREATE SEQUENCE IF NOT EXISTS defect_code_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1;

CREATE TABLE IF NOT EXISTS defects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code VARCHAR(20) NOT NULL UNIQUE
    DEFAULT ('DEF-' || LPAD(nextval('defect_code_seq')::text, 4, '0')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  reproduction_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  severity VARCHAR(20) NOT NULL
    CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  priority VARCHAR(20) NOT NULL
    CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  status VARCHAR(20) NOT NULL DEFAULT 'Open'
    CHECK (status IN ('Open', 'Approved', 'Rejected', 'In Progress', 'Resolved')),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  sprint_name VARCHAR(120),
  linked_run VARCHAR(120),
  linked_case VARCHAR(120),
  environment VARCHAR(120),
  rejection_reason TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS defect_id UUID REFERENCES defects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_defects_project_id
  ON defects(project_id);

CREATE INDEX IF NOT EXISTS idx_defects_status
  ON defects(status);

CREATE INDEX IF NOT EXISTS idx_defects_creator_id
  ON defects(creator_id);

CREATE INDEX IF NOT EXISTS idx_defects_assignee_id
  ON defects(assignee_id);

CREATE INDEX IF NOT EXISTS idx_defects_linked_task_id
  ON defects(linked_task_id);

CREATE INDEX IF NOT EXISTS idx_tasks_defect_id
  ON tasks(defect_id);

DROP TRIGGER IF EXISTS update_defects_updated_at ON defects;
CREATE TRIGGER update_defects_updated_at
  BEFORE UPDATE ON defects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
