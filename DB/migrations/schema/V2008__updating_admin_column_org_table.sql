ALTER TABLE organization
ADD COLUMN IF NOT EXISTS admin UUID;

UPDATE organization
SET admin = created_by
WHERE admin IS NULL;

ALTER TABLE organization
ALTER COLUMN admin SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'organization_admin_fkey'
    ) THEN
        ALTER TABLE organization
        ADD CONSTRAINT organization_admin_fkey
        FOREIGN KEY (admin) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organization_admin ON organization(admin);
