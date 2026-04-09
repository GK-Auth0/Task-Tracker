ALTER TABLE invites
    ALTER COLUMN org_code TYPE VARCHAR(12);

UPDATE invites
SET org_code = UPPER(SUBSTRING(invite_code FROM 1 FOR 8))
WHERE TRUE;

DROP INDEX IF EXISTS idx_invites_org_code;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invites_org_code ON invites(org_code);
