CREATE SEQUENCE IF NOT EXISTS test_case_code_seq
  START WITH 1
  INCREMENT BY 1
  MINVALUE 1;

CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_code VARCHAR(20) NOT NULL UNIQUE
    DEFAULT ('TC-' || LPAD(nextval('test_case_code_seq')::text, 4, '0')),
  title VARCHAR(255) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  linked_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  suite VARCHAR(120) NOT NULL,
  module VARCHAR(120) NOT NULL,
  sprint_name VARCHAR(120),
  priority VARCHAR(20) NOT NULL
    CHECK (priority IN ('Critical', 'High', 'Medium', 'Low')),
  status VARCHAR(20) NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Ready', 'Blocked', 'Passed', 'Failed')),
  automation VARCHAR(20) NOT NULL DEFAULT 'Manual'
    CHECK (automation IN ('Manual', 'Automated', 'Candidate')),
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  preconditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  execution_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_test_cases_project_id
  ON test_cases(project_id);

CREATE INDEX IF NOT EXISTS idx_test_cases_owner_id
  ON test_cases(owner_id);

CREATE INDEX IF NOT EXISTS idx_test_cases_status
  ON test_cases(status);

CREATE INDEX IF NOT EXISTS idx_test_cases_linked_task_id
  ON test_cases(linked_task_id);

DROP TRIGGER IF EXISTS update_test_cases_updated_at ON test_cases;
CREATE TRIGGER update_test_cases_updated_at
  BEFORE UPDATE ON test_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
