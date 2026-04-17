-- Refresh seeded quality data so demo test cases and defects align with the
-- current sprint-linked demo tasks introduced by the newer seeders.
DO $$
DECLARE
  brand_identity_project_id UUID;
  q4_marketing_project_id UUID;
  website_redesign_project_id UUID;

  giri_id UUID;
  giridharan_id UUID;
  mike_id UUID;
  sarah_id UUID;

  brand_sprint_1_id UUID;
  marketing_sprint_1_id UUID;
  website_sprint_1_id UUID;

  task_logo_concepts_id UUID;
  task_typography_selection_id UUID;
  task_launch_readiness_id UUID;
  task_landing_page_copy_id UUID;
  task_accessibility_review_id UUID;
  task_cms_content_migration_id UUID;

  brand_logo_test_case_id UUID;
  marketing_launch_test_case_id UUID;
  website_accessibility_test_case_id UUID;

  brand_defect_id UUID;
  marketing_defect_id UUID;
  website_defect_id UUID;
BEGIN
  SELECT id INTO giri_id FROM users WHERE email = 'giri.gk@company.com' LIMIT 1;
  SELECT id INTO giridharan_id FROM users WHERE email = 'giridharan.gk@company.com' LIMIT 1;
  SELECT id INTO mike_id FROM users WHERE email = 'mike.johnson@company.com' LIMIT 1;
  SELECT id INTO sarah_id FROM users WHERE email = 'sarah.wilson@company.com' LIMIT 1;

  SELECT id INTO brand_identity_project_id
  FROM projects
  WHERE name = 'Brand Identity'
  LIMIT 1;

  SELECT id INTO q4_marketing_project_id
  FROM projects
  WHERE name = 'Q4 Marketing'
  LIMIT 1;

  SELECT id INTO website_redesign_project_id
  FROM projects
  WHERE name = 'Website Redesign'
  LIMIT 1;

  SELECT id INTO brand_sprint_1_id
  FROM sprints
  WHERE project_id = brand_identity_project_id
    AND name = 'Sprint 1'
  LIMIT 1;

  SELECT id INTO marketing_sprint_1_id
  FROM sprints
  WHERE project_id = q4_marketing_project_id
    AND name = 'Sprint 1'
  LIMIT 1;

  SELECT id INTO website_sprint_1_id
  FROM sprints
  WHERE project_id = website_redesign_project_id
    AND name = 'Sprint 1'
  LIMIT 1;

  SELECT id INTO task_logo_concepts_id
  FROM tasks
  WHERE project_id = brand_identity_project_id
    AND title IN ('Logo Concepts', 'Create logo concepts')
  ORDER BY updated_at DESC
  LIMIT 1;

  SELECT id INTO task_typography_selection_id
  FROM tasks
  WHERE project_id = brand_identity_project_id
    AND title = 'Typography Selection'
  LIMIT 1;

  SELECT id INTO task_launch_readiness_id
  FROM tasks
  WHERE project_id = q4_marketing_project_id
    AND title = 'Launch Readiness Checklist'
  LIMIT 1;

  SELECT id INTO task_landing_page_copy_id
  FROM tasks
  WHERE project_id = q4_marketing_project_id
    AND title = 'Landing Page Copy Refresh'
  LIMIT 1;

  SELECT id INTO task_accessibility_review_id
  FROM tasks
  WHERE project_id = website_redesign_project_id
    AND title = 'Accessibility Review'
  LIMIT 1;

  SELECT id INTO task_cms_content_migration_id
  FROM tasks
  WHERE project_id = website_redesign_project_id
    AND title = 'CMS Content Migration'
  LIMIT 1;

  -- Remove stale sprint-name-era demo quality rows that still point at deleted legacy sprints.
  DELETE FROM defects
  WHERE project_id IN (
      COALESCE(brand_identity_project_id, '00000000-0000-0000-0000-000000000000'::uuid),
      COALESCE(q4_marketing_project_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    AND sprint_id IS NULL
    AND sprint_name IN ('Sprint 24 Brand Foundation', 'Sprint 18 Campaign Launch Prep');

  DELETE FROM test_cases
  WHERE project_id IN (
      COALESCE(brand_identity_project_id, '00000000-0000-0000-0000-000000000000'::uuid),
      COALESCE(q4_marketing_project_id, '00000000-0000-0000-0000-000000000000'::uuid)
    )
    AND sprint_id IS NULL
    AND sprint_name IN ('Sprint 24 Brand Foundation', 'Sprint 18 Campaign Launch Prep');

  -- Normalize curated seeded test cases so they use current sprint ids and task links.
  UPDATE test_cases
  SET linked_task_id = task_logo_concepts_id,
      owner_id = COALESCE(giri_id, owner_id),
      sprint_id = brand_sprint_1_id,
      sprint_name = 'Sprint 1',
      linked_items = jsonb_build_array(
        jsonb_build_object(
          'id',
          COALESCE(task_logo_concepts_id::text, 'brand-logo-task'),
          'type',
          'Story',
          'title',
          'Logo Concepts'
        )
      )
  WHERE project_id = brand_identity_project_id
    AND title = 'Validate primary logo variants render correctly';

  UPDATE test_cases
  SET linked_task_id = task_typography_selection_id,
      owner_id = COALESCE(giridharan_id, owner_id),
      sprint_id = brand_sprint_1_id,
      sprint_name = 'Sprint 1',
      linked_items = CASE
        WHEN task_typography_selection_id IS NULL THEN '[]'::jsonb
        ELSE jsonb_build_array(
          jsonb_build_object(
            'id',
            task_typography_selection_id::text,
            'type',
            'Task',
            'title',
            'Typography Selection'
          )
        )
      END
  WHERE project_id = brand_identity_project_id
    AND title = 'Confirm typography pairing guidance is complete';

  UPDATE test_cases
  SET linked_task_id = task_launch_readiness_id,
      owner_id = COALESCE(giridharan_id, owner_id),
      sprint_id = marketing_sprint_1_id,
      sprint_name = 'Sprint 1',
      linked_items = jsonb_build_array(
        jsonb_build_object(
          'id',
          COALESCE(task_launch_readiness_id::text, 'launch-readiness-task'),
          'type',
          'Story',
          'title',
          'Launch Readiness Checklist'
        )
      )
  WHERE project_id = q4_marketing_project_id
    AND title = 'Verify launch checklist covers all release dependencies';

  UPDATE test_cases
  SET linked_task_id = task_landing_page_copy_id,
      owner_id = COALESCE(sarah_id, owner_id),
      sprint_id = marketing_sprint_1_id,
      sprint_name = 'Sprint 1',
      linked_items = CASE
        WHEN task_landing_page_copy_id IS NULL THEN '[]'::jsonb
        ELSE jsonb_build_array(
          jsonb_build_object(
            'id',
            task_landing_page_copy_id::text,
            'type',
            'Story',
            'title',
            'Landing Page Copy Refresh'
          )
        )
      END
  WHERE project_id = q4_marketing_project_id
    AND title = 'Validate landing page hero copy across key breakpoints';

  UPDATE test_cases
  SET linked_task_id = task_accessibility_review_id,
      owner_id = COALESCE(mike_id, owner_id),
      sprint_id = website_sprint_1_id,
      sprint_name = 'Sprint 1',
      linked_items = jsonb_build_array(
        jsonb_build_object(
          'id',
          COALESCE(task_accessibility_review_id::text, 'accessibility-review-task'),
          'type',
          'Bug',
          'title',
          'Accessibility Review'
        )
      )
  WHERE project_id = website_redesign_project_id
    AND title = 'Audit homepage keyboard navigation and landmarks';

  UPDATE test_cases
  SET linked_task_id = task_cms_content_migration_id,
      owner_id = COALESCE(sarah_id, owner_id),
      sprint_id = website_sprint_1_id,
      sprint_name = 'Sprint 1',
      linked_items = CASE
        WHEN task_cms_content_migration_id IS NULL THEN '[]'::jsonb
        ELSE jsonb_build_array(
          jsonb_build_object(
            'id',
            task_cms_content_migration_id::text,
            'type',
            'Task',
            'title',
            'CMS Content Migration'
          )
        )
      END
  WHERE project_id = website_redesign_project_id
    AND title = 'Check CMS content migration renders approved blocks';

  SELECT id INTO brand_logo_test_case_id
  FROM test_cases
  WHERE project_id = brand_identity_project_id
    AND title = 'Validate primary logo variants render correctly'
  LIMIT 1;

  SELECT id INTO marketing_launch_test_case_id
  FROM test_cases
  WHERE project_id = q4_marketing_project_id
    AND title = 'Verify launch checklist covers all release dependencies'
  LIMIT 1;

  SELECT id INTO website_accessibility_test_case_id
  FROM test_cases
  WHERE project_id = website_redesign_project_id
    AND title = 'Audit homepage keyboard navigation and landmarks'
  LIMIT 1;

  -- Seed a compact set of demo defects aligned to the curated test cases and tasks.
  IF brand_identity_project_id IS NOT NULL THEN
    INSERT INTO defects (
      title,
      description,
      reproduction_steps,
      severity,
      priority,
      status,
      project_id,
      linked_task_id,
      creator_id,
      assignee_id,
      sprint_id,
      sprint_name,
      linked_case,
      environment
    )
    SELECT
      'Logo clear-space is inconsistent in the dark export pack',
      'The dark-background export pack includes at least one primary logo asset that violates the documented clear-space rule.',
      '[
        "Open the exported dark-background logo package.",
        "Compare spacing around the approved primary logo against the draft guideline.",
        "Inspect the social and presentation variants side by side."
      ]'::jsonb,
      'Medium',
      'High',
      'Open',
      brand_identity_project_id,
      task_logo_concepts_id,
      COALESCE(giri_id, giridharan_id),
      giridharan_id,
      brand_sprint_1_id,
      'Sprint 1',
      COALESCE(brand_logo_test_case_id::text, 'Validate primary logo variants render correctly'),
      'Design QA'
    WHERE NOT EXISTS (
      SELECT 1
      FROM defects
      WHERE project_id = brand_identity_project_id
        AND title = 'Logo clear-space is inconsistent in the dark export pack'
    );

    UPDATE defects
    SET linked_task_id = task_logo_concepts_id,
        creator_id = COALESCE(giri_id, creator_id),
        assignee_id = COALESCE(giridharan_id, assignee_id),
        sprint_id = brand_sprint_1_id,
        sprint_name = 'Sprint 1',
        linked_case = COALESCE(brand_logo_test_case_id::text, linked_case),
        environment = 'Design QA'
    WHERE project_id = brand_identity_project_id
      AND title = 'Logo clear-space is inconsistent in the dark export pack';

    SELECT id INTO brand_defect_id
    FROM defects
    WHERE project_id = brand_identity_project_id
      AND title = 'Logo clear-space is inconsistent in the dark export pack'
    LIMIT 1;

    UPDATE tasks
    SET defect_id = brand_defect_id
    WHERE id = task_logo_concepts_id
      AND brand_defect_id IS NOT NULL;
  END IF;

  IF q4_marketing_project_id IS NOT NULL THEN
    INSERT INTO defects (
      title,
      description,
      reproduction_steps,
      severity,
      priority,
      status,
      project_id,
      linked_task_id,
      creator_id,
      assignee_id,
      sprint_id,
      sprint_name,
      linked_case,
      environment
    )
    SELECT
      'Launch checklist is missing paid social UTM ownership',
      'The launch readiness checklist does not clearly assign ownership for paid social UTM validation, which blocks final sign-off.',
      '[
        "Open the latest launch readiness checklist.",
        "Review the analytics and tracking ownership section.",
        "Verify every outbound channel has a named owner."
      ]'::jsonb,
      'High',
      'Critical',
      'Open',
      q4_marketing_project_id,
      task_launch_readiness_id,
      COALESCE(giridharan_id, sarah_id),
      mike_id,
      marketing_sprint_1_id,
      'Sprint 1',
      COALESCE(marketing_launch_test_case_id::text, 'Verify launch checklist covers all release dependencies'),
      'Campaign QA'
    WHERE NOT EXISTS (
      SELECT 1
      FROM defects
      WHERE project_id = q4_marketing_project_id
        AND title = 'Launch checklist is missing paid social UTM ownership'
    );

    UPDATE defects
    SET linked_task_id = task_launch_readiness_id,
        creator_id = COALESCE(giridharan_id, creator_id),
        assignee_id = COALESCE(mike_id, assignee_id),
        sprint_id = marketing_sprint_1_id,
        sprint_name = 'Sprint 1',
        linked_case = COALESCE(marketing_launch_test_case_id::text, linked_case),
        environment = 'Campaign QA'
    WHERE project_id = q4_marketing_project_id
      AND title = 'Launch checklist is missing paid social UTM ownership';

    SELECT id INTO marketing_defect_id
    FROM defects
    WHERE project_id = q4_marketing_project_id
      AND title = 'Launch checklist is missing paid social UTM ownership'
    LIMIT 1;

    UPDATE tasks
    SET defect_id = marketing_defect_id
    WHERE id = task_launch_readiness_id
      AND marketing_defect_id IS NOT NULL;
  END IF;

  IF website_redesign_project_id IS NOT NULL THEN
    INSERT INTO defects (
      title,
      description,
      reproduction_steps,
      severity,
      priority,
      status,
      project_id,
      linked_task_id,
      creator_id,
      assignee_id,
      sprint_id,
      sprint_name,
      linked_case,
      environment
    )
    SELECT
      'Footer links lose visible focus on tablet width',
      'Keyboard users lose the visible focus indicator on footer links at tablet breakpoints in the redesigned site.',
      '[
        "Open the redesigned site on a tablet-width viewport.",
        "Tab through the footer navigation links.",
        "Observe the focus ring on each interactive element."
      ]'::jsonb,
      'High',
      'Critical',
      'Open',
      website_redesign_project_id,
      task_accessibility_review_id,
      COALESCE(mike_id, sarah_id),
      sarah_id,
      website_sprint_1_id,
      'Sprint 1',
      COALESCE(website_accessibility_test_case_id::text, 'Audit homepage keyboard navigation and landmarks'),
      'Staging'
    WHERE NOT EXISTS (
      SELECT 1
      FROM defects
      WHERE project_id = website_redesign_project_id
        AND title = 'Footer links lose visible focus on tablet width'
    );

    UPDATE defects
    SET linked_task_id = task_accessibility_review_id,
        creator_id = COALESCE(mike_id, creator_id),
        assignee_id = COALESCE(sarah_id, assignee_id),
        sprint_id = website_sprint_1_id,
        sprint_name = 'Sprint 1',
        linked_case = COALESCE(website_accessibility_test_case_id::text, linked_case),
        environment = 'Staging'
    WHERE project_id = website_redesign_project_id
      AND title = 'Footer links lose visible focus on tablet width';

    SELECT id INTO website_defect_id
    FROM defects
    WHERE project_id = website_redesign_project_id
      AND title = 'Footer links lose visible focus on tablet width'
    LIMIT 1;

    UPDATE tasks
    SET defect_id = website_defect_id
    WHERE id = task_accessibility_review_id
      AND website_defect_id IS NOT NULL;
  END IF;
END $$;
