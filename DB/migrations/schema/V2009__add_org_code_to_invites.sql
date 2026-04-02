ALTER TABLE invites
    ADD COLUMN IF NOT EXISTS org_code CHAR(6);

UPDATE invites i
SET org_code = o.org_code
FROM users u
JOIN organization o ON o.id = u.organization_id
WHERE i.inviter_id = u.id
  AND i.org_code IS NULL;

CREATE INDEX IF NOT EXISTS idx_invites_org_code ON invites(org_code);
