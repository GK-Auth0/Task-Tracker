CREATE TABLE IF NOT EXISTS project_confidential_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  decision_note TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  decided_at TIMESTAMP WITH TIME ZONE,
  decided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_project_conf_access_project
  ON project_confidential_access_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_project_conf_access_requester
  ON project_confidential_access_requests(requester_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_project_conf_access_pending
  ON project_confidential_access_requests(project_id, requester_id)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS update_project_confidential_access_requests_updated_at ON project_confidential_access_requests;
CREATE TRIGGER update_project_confidential_access_requests_updated_at
  BEFORE UPDATE ON project_confidential_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
