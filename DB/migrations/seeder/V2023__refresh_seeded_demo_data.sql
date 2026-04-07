-- Refresh seeded demo data with realistic sprint naming and richer sample tasks
DO $$
DECLARE
  brand_identity_project_id UUID;
  q4_marketing_project_id UUID;
  website_redesign_project_id UUID;
  brand_owner_id UUID;
  marketing_owner_id UUID;
  website_owner_id UUID;
  giri_id UUID;
  giridharan_id UUID;
  mike_id UUID;
  sarah_id UUID;
  brand_sprint_1_id UUID;
  brand_sprint_2_id UUID;
  marketing_sprint_1_id UUID;
  website_sprint_1_id UUID;
  current_task_id UUID;
BEGIN
  SELECT id INTO giri_id FROM users WHERE email = 'giri.gk@company.com' LIMIT 1;
  SELECT id INTO giridharan_id FROM users WHERE email = 'giridharan.gk@company.com' LIMIT 1;
  SELECT id INTO mike_id FROM users WHERE email = 'mike.johnson@company.com' LIMIT 1;
  SELECT id INTO sarah_id FROM users WHERE email = 'sarah.wilson@company.com' LIMIT 1;

  SELECT id, owner_id
  INTO brand_identity_project_id, brand_owner_id
  FROM projects
  WHERE name = 'Brand Identity'
  LIMIT 1;

  SELECT id, owner_id
  INTO q4_marketing_project_id, marketing_owner_id
  FROM projects
  WHERE name = 'Q4 Marketing'
  LIMIT 1;

  SELECT id, owner_id
  INTO website_redesign_project_id, website_owner_id
  FROM projects
  WHERE name = 'Website Redesign'
  LIMIT 1;

  -- Remove the old unrealistic seeded sprint names.
  DELETE FROM sprints
  WHERE name IN (
    'Sprint 24 Brand Foundation',
    'Sprint 18 Campaign Launch Prep'
  );

  IF brand_identity_project_id IS NOT NULL THEN
    INSERT INTO sprints (
      name, goal, release, squad, project_id, owner_id, capacity, start_date, end_date, status
    )
    SELECT
      'Sprint 1',
      'Finalize the identity foundation, align on logo direction, and prepare the first stakeholder review.',
      'Brand Refresh',
      'Design Ops',
      brand_identity_project_id,
      brand_owner_id,
      24,
      CURRENT_DATE - INTERVAL '4 days',
      CURRENT_DATE + INTERVAL '10 days',
      'Active'
    WHERE NOT EXISTS (
      SELECT 1 FROM sprints WHERE project_id = brand_identity_project_id AND name = 'Sprint 1'
    );

    INSERT INTO sprints (
      name, goal, release, squad, project_id, owner_id, capacity, start_date, end_date, status
    )
    SELECT
      'Sprint 2',
      'Translate the approved identity into rollout assets, governance notes, and export-ready files.',
      'Brand Refresh',
      'Design Ops',
      brand_identity_project_id,
      brand_owner_id,
      24,
      CURRENT_DATE + INTERVAL '11 days',
      CURRENT_DATE + INTERVAL '25 days',
      'Planning'
    WHERE NOT EXISTS (
      SELECT 1 FROM sprints WHERE project_id = brand_identity_project_id AND name = 'Sprint 2'
    );

    SELECT id INTO brand_sprint_1_id
    FROM sprints
    WHERE project_id = brand_identity_project_id AND name = 'Sprint 1'
    LIMIT 1;

    SELECT id INTO brand_sprint_2_id
    FROM sprints
    WHERE project_id = brand_identity_project_id AND name = 'Sprint 2'
    LIMIT 1;

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      brand_identity_project_id,
      'Brand Guidelines Draft',
      'Compile logo usage, spacing, color, typography, and tone rules into the first reviewable guideline draft.',
      'In Progress',
      'High',
      'Story',
      CURRENT_DATE + INTERVAL '6 days',
      giri_id,
      giridharan_id,
      brand_sprint_1_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = brand_identity_project_id AND title = 'Brand Guidelines Draft'
    );

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      brand_identity_project_id,
      'Stakeholder Review Deck',
      'Prepare a concise deck showing logo directions, typography, palette, and recommendation summary for Sprint 2 review.',
      'To Do',
      'Medium',
      'Task',
      CURRENT_DATE + INTERVAL '15 days',
      giri_id,
      sarah_id,
      brand_sprint_2_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = brand_identity_project_id AND title = 'Stakeholder Review Deck'
    );

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      brand_identity_project_id,
      'Asset Export Checklist',
      'Create a release checklist for all logo variants, social crops, favicon sizes, and handoff packaging.',
      'To Do',
      'Low',
      'Task',
      CURRENT_DATE + INTERVAL '18 days',
      giri_id,
      mike_id,
      brand_sprint_2_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = brand_identity_project_id AND title = 'Asset Export Checklist'
    );

    UPDATE tasks
    SET sprint_id = brand_sprint_1_id
    WHERE project_id = brand_identity_project_id
      AND title IN (
        'Design System Setup',
        'Logo Concepts',
        'Create logo concepts',
        'Color palette selection',
        'Typography Selection',
        'Brand Guidelines Draft'
      );

    UPDATE tasks
    SET sprint_id = brand_sprint_2_id
    WHERE project_id = brand_identity_project_id
      AND title IN (
        'Stakeholder Review Deck',
        'Asset Export Checklist'
      );
  END IF;

  IF q4_marketing_project_id IS NOT NULL THEN
    INSERT INTO sprints (
      name, goal, release, squad, project_id, owner_id, capacity, start_date, end_date, status
    )
    SELECT
      'Sprint 1',
      'Prepare campaign planning, content, and QA so the team is ready for launch sign-off.',
      'Q4 Campaign',
      'Growth Marketing',
      q4_marketing_project_id,
      marketing_owner_id,
      28,
      CURRENT_DATE - INTERVAL '3 days',
      CURRENT_DATE + INTERVAL '11 days',
      'Active'
    WHERE NOT EXISTS (
      SELECT 1 FROM sprints WHERE project_id = q4_marketing_project_id AND name = 'Sprint 1'
    );

    SELECT id INTO marketing_sprint_1_id
    FROM sprints
    WHERE project_id = q4_marketing_project_id AND name = 'Sprint 1'
    LIMIT 1;

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      q4_marketing_project_id,
      'Landing Page Copy Refresh',
      'Rewrite the primary Q4 landing page messaging to align with the new campaign narrative and CTA hierarchy.',
      'In Progress',
      'High',
      'Story',
      CURRENT_DATE + INTERVAL '5 days',
      giridharan_id,
      sarah_id,
      marketing_sprint_1_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = q4_marketing_project_id AND title = 'Landing Page Copy Refresh'
    );

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      q4_marketing_project_id,
      'Launch Readiness Checklist',
      'Track approvals, distribution dates, analytics tags, and final QA before the campaign goes live.',
      'To Do',
      'Medium',
      'Task',
      CURRENT_DATE + INTERVAL '7 days',
      giridharan_id,
      mike_id,
      marketing_sprint_1_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = q4_marketing_project_id AND title = 'Launch Readiness Checklist'
    );

    UPDATE tasks
    SET sprint_id = marketing_sprint_1_id
    WHERE project_id = q4_marketing_project_id
      AND title IN (
        'Campaign Strategy',
        'Social Media Content',
        'Social media campaign',
        'Email Templates',
        'Quality Assurance',
        'Landing Page Copy Refresh',
        'Launch Readiness Checklist'
      );
  END IF;

  IF website_redesign_project_id IS NOT NULL THEN
    INSERT INTO sprints (
      name, goal, release, squad, project_id, owner_id, capacity, start_date, end_date, status
    )
    SELECT
      'Sprint 1',
      'Ship the first stable redesign slice with responsive coverage, accessibility review, and content migration prep.',
      'Website Revamp',
      'Web Platform',
      website_redesign_project_id,
      website_owner_id,
      30,
      CURRENT_DATE - INTERVAL '2 days',
      CURRENT_DATE + INTERVAL '12 days',
      'Active'
    WHERE NOT EXISTS (
      SELECT 1 FROM sprints WHERE project_id = website_redesign_project_id AND name = 'Sprint 1'
    );

    SELECT id INTO website_sprint_1_id
    FROM sprints
    WHERE project_id = website_redesign_project_id AND name = 'Sprint 1'
    LIMIT 1;

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      website_redesign_project_id,
      'Accessibility Review',
      'Audit the redesigned pages for keyboard navigation, heading structure, contrast, and screen reader support.',
      'In Progress',
      'High',
      'Bug',
      CURRENT_DATE + INTERVAL '6 days',
      mike_id,
      sarah_id,
      website_sprint_1_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = website_redesign_project_id AND title = 'Accessibility Review'
    );

    INSERT INTO tasks (
      id, project_id, title, description, status, priority, issue_type, due_date, creator_id, assignee_id, sprint_id, created_at, updated_at
    )
    SELECT
      uuid_generate_v4(),
      website_redesign_project_id,
      'CMS Content Migration',
      'Move approved content blocks into the new CMS structure and validate page assembly in staging.',
      'To Do',
      'Medium',
      'Task',
      CURRENT_DATE + INTERVAL '9 days',
      mike_id,
      giridharan_id,
      website_sprint_1_id,
      NOW(),
      NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM tasks WHERE project_id = website_redesign_project_id AND title = 'CMS Content Migration'
    );

    UPDATE tasks
    SET sprint_id = website_sprint_1_id
    WHERE project_id = website_redesign_project_id
      AND title IN (
        'Frontend Architecture',
        'Responsive Design',
        'Content Audit',
        'Feedback Collection',
        'Accessibility Review',
        'CMS Content Migration'
      );
  END IF;

  -- Add a few subtasks for the richer seeded tasks.
  SELECT id INTO current_task_id FROM tasks WHERE title = 'Brand Guidelines Draft' LIMIT 1;
  IF current_task_id IS NOT NULL THEN
    INSERT INTO subtasks (id, task_id, title, is_completed, position)
    SELECT uuid_generate_v4(), current_task_id, 'Document logo clear-space rules', true, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM subtasks WHERE task_id = current_task_id AND title = 'Document logo clear-space rules'
    );
    INSERT INTO subtasks (id, task_id, title, is_completed, position)
    SELECT uuid_generate_v4(), current_task_id, 'Add typography pairing examples', false, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM subtasks WHERE task_id = current_task_id AND title = 'Add typography pairing examples'
    );
  END IF;

  SELECT id INTO current_task_id FROM tasks WHERE title = 'Launch Readiness Checklist' LIMIT 1;
  IF current_task_id IS NOT NULL THEN
    INSERT INTO subtasks (id, task_id, title, is_completed, position)
    SELECT uuid_generate_v4(), current_task_id, 'Confirm campaign links and UTMs', false, 1
    WHERE NOT EXISTS (
      SELECT 1 FROM subtasks WHERE task_id = current_task_id AND title = 'Confirm campaign links and UTMs'
    );
    INSERT INTO subtasks (id, task_id, title, is_completed, position)
    SELECT uuid_generate_v4(), current_task_id, 'Validate email send windows', false, 2
    WHERE NOT EXISTS (
      SELECT 1 FROM subtasks WHERE task_id = current_task_id AND title = 'Validate email send windows'
    );
  END IF;

  -- Add a few contextual comments.
  INSERT INTO comments (id, task_id, user_id, content, created_at)
  SELECT
    uuid_generate_v4(),
    t.id,
    giri_id,
    'Let us keep this seeded task realistic for the Sprint 1 review walkthrough.',
    NOW() - INTERVAL '2 hours'
  FROM tasks t
  WHERE t.title = 'Brand Guidelines Draft'
    AND NOT EXISTS (
      SELECT 1 FROM comments c WHERE c.task_id = t.id AND c.content = 'Let us keep this seeded task realistic for the Sprint 1 review walkthrough.'
    );

  INSERT INTO comments (id, task_id, user_id, content, created_at)
  SELECT
    uuid_generate_v4(),
    t.id,
    giridharan_id,
    'Tracking launch dependencies here makes the demo data much easier to understand.',
    NOW() - INTERVAL '90 minutes'
  FROM tasks t
  WHERE t.title = 'Launch Readiness Checklist'
    AND NOT EXISTS (
      SELECT 1 FROM comments c WHERE c.task_id = t.id AND c.content = 'Tracking launch dependencies here makes the demo data much easier to understand.'
    );
END $$;
