-- Normalize workspace roles and enforce default role
UPDATE users
SET role = CASE
  WHEN LOWER(role) = 'admin' THEN 'Admin'
  WHEN LOWER(role) = 'member' THEN 'Member'
  WHEN LOWER(role) = 'viewer' THEN 'Viewer'
  ELSE role
END;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
ADD CONSTRAINT users_role_check
CHECK (role IN ('Admin', 'Member', 'Viewer'));

ALTER TABLE users
ALTER COLUMN role SET DEFAULT 'Member';
