-- Seed base Task Tracker data
-- Migration: V2001__seed_base_data.sql

-- Seed Users (password: 'password123' for all users)
INSERT INTO users (id, full_name, email, password_hash, avatar_url, role, created_at, updated_at) VALUES
(uuid_generate_v4(), 'John Doe', 'john.doe@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', 'Admin', NOW(), NOW()),
(uuid_generate_v4(), 'Jane Smith', 'jane.smith@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', 'Member', NOW(), NOW()),
(uuid_generate_v4(), 'Mike Johnson', 'mike.johnson@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', 'Member', NOW(), NOW()),
(uuid_generate_v4(), 'Sarah Wilson', 'sarah.wilson@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', 'Viewer', NOW(), NOW());

-- Seed Projects
INSERT INTO projects (id, name, description, owner_id, status, created_at) VALUES
(uuid_generate_v4(), 'Brand Identity', 'Complete rebrand project for Q4 launch', (SELECT id FROM users WHERE email = 'john.doe@company.com'), 'Active', NOW()),
(uuid_generate_v4(), 'Q4 Marketing', 'Marketing campaigns and materials for Q4', (SELECT id FROM users WHERE email = 'jane.smith@company.com'), 'Active', NOW()),
(uuid_generate_v4(), 'Website Redesign', 'New company website with modern design', (SELECT id FROM users WHERE email = 'mike.johnson@company.com'), 'Active', NOW());

-- Seed Labels
INSERT INTO labels (id, name, color_hex) VALUES
(uuid_generate_v4(), 'Design', '#3B82F6'),
(uuid_generate_v4(), 'Bug', '#EF4444'),
(uuid_generate_v4(), 'High Priority', '#F59E0B'),
(uuid_generate_v4(), 'Frontend', '#10B981'),
(uuid_generate_v4(), 'Backend', '#8B5CF6'),
(uuid_generate_v4(), 'Research', '#EC4899');