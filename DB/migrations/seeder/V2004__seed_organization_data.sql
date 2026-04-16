-- Seed organizations and map sample users to them

INSERT INTO organization (name, slug, description, logo_url, admin, created_by)
SELECT
    'Task Tracker Labs',
    'task-tracker-labs',
    'Core product organization responsible for platform delivery, engineering, and design.',
    'https://images.unsplash.com/photo-1551434678-e076c223a692?w=240',
    u.id,
    u.id
FROM users u
WHERE u.email = 'giri.gk@company.com'
  AND NOT EXISTS (
      SELECT 1 FROM organization o WHERE o.slug = 'task-tracker-labs'
  );

INSERT INTO organization (name, slug, description, logo_url, admin, created_by)
SELECT
    'Growth Ops',
    'growth-ops',
    'Organization focused on campaigns, content operations, and customer growth initiatives.',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=240',
    u.id,
    u.id
FROM users u
WHERE u.email = 'giridharan.gk@company.com'
  AND NOT EXISTS (
      SELECT 1 FROM organization o WHERE o.slug = 'growth-ops'
  );

INSERT INTO organization (name, slug, description, logo_url, admin, created_by)
SELECT
    'Delivery Hub',
    'delivery-hub',
    'Cross-functional organization for implementation, QA, release readiness, and support tooling.',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=240',
    u.id,
    u.id
FROM users u
WHERE u.email = 'mike.johnson@company.com'
  AND NOT EXISTS (
      SELECT 1 FROM organization o WHERE o.slug = 'delivery-hub'
  );

UPDATE users
SET organization_id = (
    SELECT id FROM organization WHERE slug = 'task-tracker-labs'
)
WHERE email = 'giri.gk@company.com'
  AND organization_id IS NULL;

UPDATE users
SET organization_id = (
    SELECT id FROM organization WHERE slug = 'growth-ops'
)
WHERE email = 'giridharan.gk@company.com'
  AND organization_id IS NULL;

UPDATE users
SET organization_id = (
    SELECT id FROM organization WHERE slug = 'delivery-hub'
)
WHERE email IN ('mike.johnson@company.com', 'sarah.wilson@company.com')
  AND organization_id IS NULL;
