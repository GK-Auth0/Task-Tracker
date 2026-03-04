-- Backfill access data for existing projects/tasks so old data works with new access model.

-- 1) Ensure every project owner is represented in project_members as owner.
INSERT INTO project_members (project_id, user_id, role, joined_at, created_at, updated_at)
SELECT
  p.id AS project_id,
  p.owner_id AS user_id,
  'owner' AS role,
  COALESCE(p.created_at, NOW()) AS joined_at,
  NOW() AS created_at,
  NOW() AS updated_at
FROM projects p
LEFT JOIN project_members pm
  ON pm.project_id = p.id
 AND pm.user_id = p.owner_id
WHERE pm.id IS NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 2) Ensure users already participating via tasks are members of that project.
--    (creator/assignee should be able to access project task board)
INSERT INTO project_members (project_id, user_id, role, joined_at, created_at, updated_at)
SELECT DISTINCT
  t.project_id,
  u.user_id,
  'member' AS role,
  NOW() AS joined_at,
  NOW() AS created_at,
  NOW() AS updated_at
FROM tasks t
JOIN LATERAL (
  VALUES (t.creator_id), (t.assignee_id)
) AS u(user_id) ON u.user_id IS NOT NULL
LEFT JOIN project_members pm
  ON pm.project_id = t.project_id
 AND pm.user_id = u.user_id
WHERE pm.id IS NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 3) Backfill confidential access for existing member/viewer users who already
--    have active task involvement in that project.
--    This avoids breaking existing seeded/demo data while keeping workflow intact.
INSERT INTO project_confidential_access_requests (
  project_id,
  requester_id,
  status,
  reason,
  decision_note,
  requested_at,
  decided_at,
  decided_by,
  created_at,
  updated_at
)
SELECT
  pm.project_id,
  pm.user_id AS requester_id,
  'approved' AS status,
  'Auto-backfilled for existing task participation in this project.' AS reason,
  'Backfilled approval to preserve existing access during migration.' AS decision_note,
  NOW() - INTERVAL '1 day' AS requested_at,
  NOW() - INTERVAL '1 day' AS decided_at,
  p.owner_id AS decided_by,
  NOW() AS created_at,
  NOW() AS updated_at
FROM project_members pm
JOIN projects p
  ON p.id = pm.project_id
JOIN tasks t
  ON t.project_id = pm.project_id
 AND (t.creator_id = pm.user_id OR t.assignee_id = pm.user_id)
LEFT JOIN project_confidential_access_requests existing
  ON existing.project_id = pm.project_id
 AND existing.requester_id = pm.user_id
WHERE pm.role IN ('member', 'viewer')
  AND existing.id IS NULL
GROUP BY pm.project_id, pm.user_id, p.owner_id;
