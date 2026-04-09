-- Seed test case suites and modules for existing demo projects
DO $$
DECLARE
  brand_identity_project_id UUID;
  q4_marketing_project_id UUID;
  website_redesign_project_id UUID;
  brand_owner_id UUID;
  marketing_owner_id UUID;
  website_owner_id UUID;
BEGIN
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

  IF brand_identity_project_id IS NOT NULL THEN
    INSERT INTO test_case_suites (name, project_id, owner_id)
    SELECT suite_name, brand_identity_project_id, brand_owner_id
    FROM (
      VALUES
        ('Brand Foundations'),
        ('Visual QA'),
        ('Release Readiness')
    ) AS suites(suite_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_case_suites tcs
      WHERE tcs.project_id = brand_identity_project_id
        AND tcs.name = suites.suite_name
    );

    INSERT INTO test_case_modules (name, project_id, owner_id)
    SELECT module_name, brand_identity_project_id, brand_owner_id
    FROM (
      VALUES
        ('Logo System'),
        ('Typography'),
        ('Color & Accessibility'),
        ('Brand Guidelines')
    ) AS modules(module_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_case_modules tcm
      WHERE tcm.project_id = brand_identity_project_id
        AND tcm.name = modules.module_name
    );
  END IF;

  IF q4_marketing_project_id IS NOT NULL THEN
    INSERT INTO test_case_suites (name, project_id, owner_id)
    SELECT suite_name, q4_marketing_project_id, marketing_owner_id
    FROM (
      VALUES
        ('Campaign Planning'),
        ('Content QA'),
        ('Launch Validation')
    ) AS suites(suite_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_case_suites tcs
      WHERE tcs.project_id = q4_marketing_project_id
        AND tcs.name = suites.suite_name
    );

    INSERT INTO test_case_modules (name, project_id, owner_id)
    SELECT module_name, q4_marketing_project_id, marketing_owner_id
    FROM (
      VALUES
        ('Landing Page'),
        ('Email Campaign'),
        ('Social Media'),
        ('Analytics Tracking')
    ) AS modules(module_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_case_modules tcm
      WHERE tcm.project_id = q4_marketing_project_id
        AND tcm.name = modules.module_name
    );
  END IF;

  IF website_redesign_project_id IS NOT NULL THEN
    INSERT INTO test_case_suites (name, project_id, owner_id)
    SELECT suite_name, website_redesign_project_id, website_owner_id
    FROM (
      VALUES
        ('Core Experience'),
        ('Responsive Coverage'),
        ('Regression Pack')
    ) AS suites(suite_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_case_suites tcs
      WHERE tcs.project_id = website_redesign_project_id
        AND tcs.name = suites.suite_name
    );

    INSERT INTO test_case_modules (name, project_id, owner_id)
    SELECT module_name, website_redesign_project_id, website_owner_id
    FROM (
      VALUES
        ('Homepage'),
        ('Navigation'),
        ('CMS Pages'),
        ('Accessibility')
    ) AS modules(module_name)
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_case_modules tcm
      WHERE tcm.project_id = website_redesign_project_id
        AND tcm.name = modules.module_name
    );
  END IF;
END $$;
