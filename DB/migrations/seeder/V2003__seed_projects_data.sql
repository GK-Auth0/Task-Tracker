-- Insert sample projects using actual user UUIDs
INSERT INTO projects (name, description, status, priority, start_date, end_date, owner_id) 
SELECT 
  'Marketing Website V3', 
  'Complete redesign of the company marketing website with modern UI/UX and improved performance', 
  'active', 
  'high', 
  '2024-01-15'::date, 
  '2024-03-30'::date, 
  u.id
FROM users u WHERE u.email = 'giri.gk@company.com'
UNION ALL
SELECT 
  'HR Dashboard Upgrade', 
  'Upgrade the internal HR dashboard with new features for employee management and analytics', 
  'active', 
  'medium', 
  '2024-02-01'::date, 
  '2024-04-15'::date, 
  u.id
FROM users u WHERE u.email = 'giridharan.gk@company.com'
UNION ALL
SELECT 
  'Mobile App V2 Launch', 
  'Launch the second version of our mobile application with enhanced features and better user experience', 
  'active', 
  'high', 
  '2024-01-01'::date, 
  '2024-02-28'::date, 
  u.id
FROM users u WHERE u.email = 'giri.gk@company.com'
UNION ALL
SELECT 
  'Q4 User Sentiment Analysis', 
  'Comprehensive analysis of user feedback and sentiment for Q4 planning and improvements', 
  'planning', 
  'medium', 
  '2024-03-01'::date, 
  '2024-05-30'::date, 
  u.id
FROM users u WHERE u.email = 'mike.johnson@company.com'
UNION ALL
SELECT 
  'Cloud Migration Phase 2', 
  'Continue the cloud infrastructure migration with focus on database and storage systems', 
  'active', 
  'high', 
  '2024-02-15'::date, 
  '2024-06-30'::date, 
  u.id
FROM users u WHERE u.email = 'giridharan.gk@company.com'
UNION ALL
SELECT 
  'Customer Support Portal', 
  'Build a self-service customer support portal to reduce support ticket volume', 
  'planning', 
  'medium', 
  '2024-04-01'::date, 
  '2024-07-15'::date, 
  u.id
FROM users u WHERE u.email = 'giri.gk@company.com'
UNION ALL
SELECT 
  'API Documentation Overhaul', 
  'Complete rewrite of API documentation with interactive examples and better organization', 
  'completed', 
  'low', 
  '2023-11-01'::date, 
  '2024-01-15'::date, 
  u.id
FROM users u WHERE u.email = 'mike.johnson@company.com'
UNION ALL
SELECT 
  'Security Audit Implementation', 
  'Implement security improvements based on the recent security audit findings', 
  'active', 
  'high', 
  '2024-02-20'::date, 
  '2024-04-30'::date, 
  u.id
FROM users u WHERE u.email = 'giridharan.gk@company.com';

-- Insert project members using actual UUIDs
INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
  p.id,
  u.id,
  'owner',
  p.created_at
FROM projects p
JOIN users u ON u.id = p.owner_id;

-- Add additional project members
INSERT INTO project_members (project_id, user_id, role, joined_at)
SELECT 
  p.id,
  u.id,
  'admin',
  p.created_at + INTERVAL '1 day'
FROM projects p
JOIN users u ON u.email = 'giridharan.gk@company.com'
WHERE p.name = 'Marketing Website V3'
UNION ALL
SELECT 
  p.id,
  u.id,
  'member',
  p.created_at + INTERVAL '2 days'
FROM projects p
JOIN users u ON u.email = 'mike.johnson@company.com'
WHERE p.name = 'Marketing Website V3'
UNION ALL
SELECT 
  p.id,
  u.id,
  'member',
  p.created_at + INTERVAL '3 days'
FROM projects p
JOIN users u ON u.email = 'sarah.wilson@company.com'
WHERE p.name = 'Marketing Website V3'
UNION ALL
SELECT 
  p.id,
  u.id,
  'member',
  p.created_at + INTERVAL '1 day'
FROM projects p
JOIN users u ON u.email = 'mike.johnson@company.com'
WHERE p.name = 'HR Dashboard Upgrade'
UNION ALL
SELECT 
  p.id,
  u.id,
  'admin',
  p.created_at + INTERVAL '1 day'
FROM projects p
JOIN users u ON u.email = 'giridharan.gk@company.com'
WHERE p.name = 'Mobile App V2 Launch'
UNION ALL
SELECT 
  p.id,
  u.id,
  'member',
  p.created_at + INTERVAL '2 days'
FROM projects p
JOIN users u ON u.email = 'mike.johnson@company.com'
WHERE p.name = 'Mobile App V2 Launch';