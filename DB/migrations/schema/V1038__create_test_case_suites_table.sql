CREATE TABLE IF NOT EXISTS test_case_suites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_test_case_suites_project_name UNIQUE (project_id, name)
);

CREATE INDEX IF NOT EXISTS idx_test_case_suites_project_id
  ON test_case_suites(project_id);

CREATE INDEX IF NOT EXISTS idx_test_case_suites_owner_id
  ON test_case_suites(owner_id);

DROP TRIGGER IF EXISTS update_test_case_suites_updated_at ON test_case_suites;
CREATE TRIGGER update_test_case_suites_updated_at
  BEFORE UPDATE ON test_case_suites
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
