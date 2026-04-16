-- Update existing subtasks with assignee data
-- Migration: V2009__update_subtasks_with_assignees.sql

DO $$
DECLARE
  giri_id UUID;
  giridharan_id UUID;
  mike_id UUID;
  sarah_id UUID;
BEGIN
  -- Get user IDs
  SELECT id INTO giri_id FROM users WHERE email = 'giri.gk@company.com' LIMIT 1;
  SELECT id INTO giridharan_id FROM users WHERE email = 'giridharan.gk@company.com' LIMIT 1;
  SELECT id INTO mike_id FROM users WHERE email = 'mike.johnson@company.com' LIMIT 1;
  SELECT id INTO sarah_id FROM users WHERE email = 'sarah.wilson@company.com' LIMIT 1;

  -- Update existing subtasks with assignees
  -- Assign subtasks for "Create logo concepts" task
  UPDATE subtasks 
  SET assignee_id = giridharan_id
  WHERE title = 'Research competitor logos' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Create logo concepts');

  UPDATE subtasks 
  SET assignee_id = giridharan_id
  WHERE title = 'Sketch initial concepts' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Create logo concepts');

  UPDATE subtasks 
  SET assignee_id = giridharan_id
  WHERE title = 'Create digital mockups' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Create logo concepts');

  -- Assign subtasks for "Brand Guidelines Draft" task
  UPDATE subtasks 
  SET assignee_id = giri_id
  WHERE title = 'Document logo clear-space rules' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Brand Guidelines Draft');

  UPDATE subtasks 
  SET assignee_id = sarah_id
  WHERE title = 'Add typography pairing examples' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Brand Guidelines Draft');

  -- Assign subtasks for "Launch Readiness Checklist" task
  UPDATE subtasks 
  SET assignee_id = mike_id
  WHERE title = 'Confirm campaign links and UTMs' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Launch Readiness Checklist');

  UPDATE subtasks 
  SET assignee_id = sarah_id
  WHERE title = 'Validate email send windows' 
    AND task_id IN (SELECT id FROM tasks WHERE title = 'Launch Readiness Checklist');

END $$;
