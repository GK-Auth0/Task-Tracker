-- Seed tasks and related data
-- Migration: V2002__seed_tasks_data.sql

-- Seed Tasks
INSERT INTO tasks (id, project_id, title, description, status, priority, due_date, creator_id, assignee_id, created_at, updated_at) VALUES
(uuid_generate_v4(), 
 (SELECT id FROM projects WHERE name = 'Brand Identity'),
 'Create logo concepts',
 'Design 3-5 initial logo concepts for client review',
 'In Progress',
 'High',
 CURRENT_DATE + INTERVAL '7 days',
 (SELECT id FROM users WHERE email = 'giri.gk@company.com'),
 (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'),
 NOW(), NOW()),
(uuid_generate_v4(),
 (SELECT id FROM projects WHERE name = 'Brand Identity'),
 'Color palette selection',
 'Define primary and secondary color schemes',
 'To Do',
 'Medium',
 CURRENT_DATE + INTERVAL '10 days',
 (SELECT id FROM users WHERE email = 'giri.gk@company.com'),
 (SELECT id FROM users WHERE email = 'mike.johnson@company.com'),
 NOW(), NOW()),
(uuid_generate_v4(),
 (SELECT id FROM projects WHERE name = 'Q4 Marketing'),
 'Social media campaign',
 'Plan and execute social media strategy for Q4',
 'Done',
 'High',
 CURRENT_DATE - INTERVAL '2 days',
 (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'),
 (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'),
 NOW(), NOW());

-- Seed Subtasks
INSERT INTO subtasks (id, task_id, title, is_completed, position) VALUES
(uuid_generate_v4(),
 (SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 'Research competitor logos',
 true,
 1),
(uuid_generate_v4(),
 (SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 'Sketch initial concepts',
 true,
 2),
(uuid_generate_v4(),
 (SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 'Create digital mockups',
 false,
 3);

-- Seed Comments
INSERT INTO comments (id, task_id, user_id, content, created_at) VALUES
(uuid_generate_v4(),
 (SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 (SELECT id FROM users WHERE email = 'giri.gk@company.com'),
 'Great progress on the initial sketches! The third concept looks promising.',
 NOW()),
(uuid_generate_v4(),
 (SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'),
 'Thanks! I''ll work on refining that concept and create some variations.',
 NOW());

-- Link tasks with labels
INSERT INTO task_labels (task_id, label_id) VALUES
((SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 (SELECT id FROM labels WHERE name = 'Design')),
((SELECT id FROM tasks WHERE title = 'Create logo concepts'),
 (SELECT id FROM labels WHERE name = 'High Priority')),
((SELECT id FROM tasks WHERE title = 'Social media campaign'),
 (SELECT id FROM labels WHERE name = 'High Priority'));