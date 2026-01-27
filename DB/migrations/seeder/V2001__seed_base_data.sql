-- Seed base Task Tracker data
-- Migration: V2001__seed_base_data.sql

-- Seed Users (password: 'password123' for all users)
INSERT INTO users (id, full_name, email, password_hash, avatar_url, role, created_at, updated_at) VALUES
(uuid_generate_v4(), 'Giri Gk', 'giri.gk@company.com', '$2b$10$xnMtU0Gh8uMNYYtfjYzxeeHr2DSER6MJb0GGSycSkocEtaEYhefHO', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Admin', NOW(), NOW()),
(uuid_generate_v4(), 'Giridharan Gk', 'giridharan.gk@company.com', '$2b$10$xnMtU0Gh8uMNYYtfjYzxeeHr2DSER6MJb0GGSycSkocEtaEYhefHO', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', 'Member', NOW(), NOW()),
(uuid_generate_v4(), 'Mike Johnson', 'mike.johnson@company.com', '$2b$10$xnMtU0Gh8uMNYYtfjYzxeeHr2DSER6MJb0GGSycSkocEtaEYhefHO', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Member', NOW(), NOW()),
(uuid_generate_v4(), 'Sarah Wilson', 'sarah.wilson@company.com', '$2b$10$xnMtU0Gh8uMNYYtfjYzxeeHr2DSER6MJb0GGSycSkocEtaEYhefHO', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'Viewer', NOW(), NOW());

-- Seed Projects
INSERT INTO projects (id, name, description, owner_id, status, created_at) VALUES
(uuid_generate_v4(), 'Brand Identity', 'Complete rebrand project for Q4 launch', (SELECT id FROM users WHERE email = 'giri.gk@company.com'), 'Active', NOW()),
(uuid_generate_v4(), 'Q4 Marketing', 'Marketing campaigns and materials for Q4', (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), 'Active', NOW()),
(uuid_generate_v4(), 'Website Redesign', 'New company website with modern design', (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), 'Active', NOW());

-- Seed Labels
INSERT INTO labels (id, name, color_hex) VALUES
(uuid_generate_v4(), 'Design', '#3B82F6'),
(uuid_generate_v4(), 'Bug', '#EF4444'),
(uuid_generate_v4(), 'High Priority', '#F59E0B'),
(uuid_generate_v4(), 'Frontend', '#10B981'),
(uuid_generate_v4(), 'Backend', '#8B5CF6'),
(uuid_generate_v4(), 'Research', '#EC4899');

-- Seed Tasks for all users
INSERT INTO tasks (id, title, description, status, priority, assignee_id, creator_id, project_id, due_date, created_at, updated_at) VALUES
-- Tasks for Giri Gk
(uuid_generate_v4(), 'Design System Setup', 'Create comprehensive design system with components and guidelines', 'In Progress', 'High', (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM projects WHERE name = 'Brand Identity'), NOW() + INTERVAL '7 days', NOW(), NOW()),
(uuid_generate_v4(), 'Logo Concepts', 'Develop 3-5 logo concepts for brand identity', 'To Do', 'Medium', (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM projects WHERE name = 'Brand Identity'), NOW() + INTERVAL '5 days', NOW(), NOW()),
(uuid_generate_v4(), 'Color Palette Research', 'Research and define brand color palette', 'Done', 'Low', (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM projects WHERE name = 'Brand Identity'), NOW() - INTERVAL '2 days', NOW(), NOW()),
(uuid_generate_v4(), 'Typography Selection', 'Choose primary and secondary fonts for brand', 'In Progress', 'Medium', (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM users WHERE email = 'giri.gk@company.com'), (SELECT id FROM projects WHERE name = 'Brand Identity'), NOW() + INTERVAL '3 days', NOW(), NOW()),

-- Tasks for Giridharan Gk
(uuid_generate_v4(), 'Campaign Strategy', 'Develop comprehensive Q4 marketing strategy', 'In Progress', 'High', (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM projects WHERE name = 'Q4 Marketing'), NOW() + INTERVAL '10 days', NOW(), NOW()),
(uuid_generate_v4(), 'Social Media Content', 'Create social media content calendar for Q4', 'To Do', 'Medium', (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM projects WHERE name = 'Q4 Marketing'), NOW() + INTERVAL '8 days', NOW(), NOW()),
(uuid_generate_v4(), 'Market Research', 'Analyze competitor strategies and market trends', 'Done', 'High', (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM projects WHERE name = 'Q4 Marketing'), NOW() - INTERVAL '1 day', NOW(), NOW()),
(uuid_generate_v4(), 'Email Templates', 'Design email marketing templates', 'To Do', 'Low', (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM users WHERE email = 'giridharan.gk@company.com'), (SELECT id FROM projects WHERE name = 'Q4 Marketing'), NOW() + INTERVAL '6 days', NOW(), NOW()),

-- Tasks for Mike Johnson
(uuid_generate_v4(), 'Frontend Architecture', 'Plan and setup frontend architecture for new website', 'In Progress', 'High', (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM projects WHERE name = 'Website Redesign'), NOW() + INTERVAL '12 days', NOW(), NOW()),
(uuid_generate_v4(), 'Responsive Design', 'Implement responsive design for all pages', 'To Do', 'Medium', (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM projects WHERE name = 'Website Redesign'), NOW() + INTERVAL '15 days', NOW(), NOW()),
(uuid_generate_v4(), 'Performance Optimization', 'Optimize website loading speed and performance', 'To Do', 'Low', (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM projects WHERE name = 'Website Redesign'), NOW() + INTERVAL '20 days', NOW(), NOW()),
(uuid_generate_v4(), 'User Testing', 'Conduct user testing sessions for new design', 'Done', 'Medium', (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), (SELECT id FROM projects WHERE name = 'Website Redesign'), NOW() - INTERVAL '3 days', NOW(), NOW()),

-- Tasks for Sarah Wilson
(uuid_generate_v4(), 'Content Audit', 'Review and audit existing website content', 'In Progress', 'Medium', (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM projects WHERE name = 'Website Redesign'), NOW() + INTERVAL '9 days', NOW(), NOW()),
(uuid_generate_v4(), 'Documentation Review', 'Review project documentation and requirements', 'Done', 'Low', (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM projects WHERE name = 'Brand Identity'), NOW() - INTERVAL '1 day', NOW(), NOW()),
(uuid_generate_v4(), 'Quality Assurance', 'Test marketing materials for quality and consistency', 'To Do', 'High', (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM projects WHERE name = 'Q4 Marketing'), NOW() + INTERVAL '4 days', NOW(), NOW()),
(uuid_generate_v4(), 'Feedback Collection', 'Collect and organize stakeholder feedback', 'In Progress', 'Medium', (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM users WHERE email = 'sarah.wilson@company.com'), (SELECT id FROM projects WHERE name = 'Website Redesign'), NOW() + INTERVAL '7 days', NOW(), NOW());