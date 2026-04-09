-- Seed realistic test cases for the demo projects using the seeded suites and modules
DO $$
DECLARE
  brand_identity_project_id UUID;
  q4_marketing_project_id UUID;
  website_redesign_project_id UUID;
  giri_id UUID;
  giridharan_id UUID;
  mike_id UUID;
  sarah_id UUID;
  task_logo_concepts_id UUID;
  task_launch_readiness_id UUID;
  task_accessibility_review_id UUID;
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

  SELECT id INTO task_logo_concepts_id
  FROM tasks
  WHERE title IN ('Logo Concepts', 'Create logo concepts')
  ORDER BY updated_at DESC
  LIMIT 1;

  SELECT id INTO task_launch_readiness_id
  FROM tasks
  WHERE title = 'Launch Readiness Checklist'
  LIMIT 1;

  SELECT id INTO task_accessibility_review_id
  FROM tasks
  WHERE title = 'Accessibility Review'
  LIMIT 1;

  IF brand_identity_project_id IS NOT NULL THEN
    INSERT INTO test_cases (
      title,
      project_id,
      linked_task_id,
      owner_id,
      suite,
      module,
      sprint_name,
      priority,
      status,
      automation,
      tags,
      preconditions,
      steps,
      linked_items,
      execution_history
    )
    SELECT
      'Validate primary logo variants render correctly',
      brand_identity_project_id,
      task_logo_concepts_id,
      giri_id,
      'Brand Foundations',
      'Logo System',
      'Sprint 1',
      'High',
      'Ready',
      'Manual',
      '["branding", "logo", "visual-regression"]'::jsonb,
      '["Latest approved logo assets are exported.", "Design review sign-off is available."]'::jsonb,
      '[
        {"id":1,"action":"Open each approved logo variant on light and dark canvases.","expected":"Each variant appears sharp, centered, and free of distortion."},
        {"id":2,"action":"Compare spacing around the mark and wordmark against the guideline draft.","expected":"Clear-space rules match the documented brand standard."},
        {"id":3,"action":"Verify export dimensions for social, web, and presentation handoff files.","expected":"All expected export sizes are present and named correctly."}
      ]'::jsonb,
      jsonb_build_array(
        jsonb_build_object('id', COALESCE(task_logo_concepts_id::text, 'brand-logo-task'), 'type', 'Story', 'title', 'Logo Concepts')
      ),
      '[
        {
          "id":"exec-brand-1",
          "cycle":"Brand Sprint 1 QA",
          "status":"Passed",
          "tester":"Giri Gk",
          "executedAt":"2026-04-05T10:00:00.000Z",
          "note":"Primary and monochrome variants matched the approved guidelines."
        }
      ]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_cases
      WHERE project_id = brand_identity_project_id
        AND title = 'Validate primary logo variants render correctly'
    );

    INSERT INTO test_cases (
      title,
      project_id,
      linked_task_id,
      owner_id,
      suite,
      module,
      sprint_name,
      priority,
      status,
      automation,
      tags,
      preconditions,
      steps,
      linked_items,
      execution_history
    )
    SELECT
      'Confirm typography pairing guidance is complete',
      brand_identity_project_id,
      NULL,
      giridharan_id,
      'Visual QA',
      'Typography',
      'Sprint 1',
      'Medium',
      'Draft',
      'Candidate',
      '["typography", "content", "guidelines"]'::jsonb,
      '["The latest brand guideline draft is accessible to QA.", "Primary and secondary font files are finalized."]'::jsonb,
      '[
        {"id":1,"action":"Review all heading/body font pairings in the brand guideline draft.","expected":"Each pairing includes approved usage guidance and hierarchy examples."},
        {"id":2,"action":"Check fallback font definitions for web usage.","expected":"Fallbacks are documented for each primary font family."}
      ]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_cases
      WHERE project_id = brand_identity_project_id
        AND title = 'Confirm typography pairing guidance is complete'
    );
  END IF;

  IF q4_marketing_project_id IS NOT NULL THEN
    INSERT INTO test_cases (
      title,
      project_id,
      linked_task_id,
      owner_id,
      suite,
      module,
      sprint_name,
      priority,
      status,
      automation,
      tags,
      preconditions,
      steps,
      linked_items,
      execution_history
    )
    SELECT
      'Verify launch checklist covers all release dependencies',
      q4_marketing_project_id,
      task_launch_readiness_id,
      giridharan_id,
      'Launch Validation',
      'Analytics Tracking',
      'Sprint 1',
      'Critical',
      'Ready',
      'Manual',
      '["launch", "checklist", "analytics"]'::jsonb,
      '["Campaign launch owner has shared the latest checklist.", "Tracking requirements are finalized."]'::jsonb,
      '[
        {"id":1,"action":"Review the checklist for approvals, delivery dates, and channel owners.","expected":"Each launch dependency has an owner and due date."},
        {"id":2,"action":"Validate all UTM and analytics requirements are listed.","expected":"Tracking requirements are complete for every outbound asset."},
        {"id":3,"action":"Confirm rollback and escalation notes are included.","expected":"A recovery path is documented for launch-day issues."}
      ]'::jsonb,
      jsonb_build_array(
        jsonb_build_object('id', COALESCE(task_launch_readiness_id::text, 'launch-readiness-task'), 'type', 'Story', 'title', 'Launch Readiness Checklist')
      ),
      '[
        {
          "id":"exec-marketing-1",
          "cycle":"Campaign Readiness Review",
          "status":"Blocked",
          "tester":"Giridharan Gk",
          "executedAt":"2026-04-06T15:30:00.000Z",
          "note":"Analytics ownership section still needs confirmation from the growth team."
        }
      ]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_cases
      WHERE project_id = q4_marketing_project_id
        AND title = 'Verify launch checklist covers all release dependencies'
    );

    INSERT INTO test_cases (
      title,
      project_id,
      linked_task_id,
      owner_id,
      suite,
      module,
      sprint_name,
      priority,
      status,
      automation,
      tags,
      preconditions,
      steps,
      linked_items,
      execution_history
    )
    SELECT
      'Validate landing page hero copy across key breakpoints',
      q4_marketing_project_id,
      NULL,
      sarah_id,
      'Content QA',
      'Landing Page',
      'Sprint 1',
      'High',
      'Draft',
      'Candidate',
      '["copy", "responsive", "marketing-site"]'::jsonb,
      '["Latest hero copy draft is in staging.", "Responsive layouts are deployed to preview."]'::jsonb,
      '[
        {"id":1,"action":"Open the landing page on desktop, tablet, and mobile widths.","expected":"Hero copy remains readable without truncation or overlap."},
        {"id":2,"action":"Compare CTA placement and line breaks across breakpoints.","expected":"CTA hierarchy and spacing remain consistent."}
      ]'::jsonb,
      '[]'::jsonb,
      '[]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_cases
      WHERE project_id = q4_marketing_project_id
        AND title = 'Validate landing page hero copy across key breakpoints'
    );
  END IF;

  IF website_redesign_project_id IS NOT NULL THEN
    INSERT INTO test_cases (
      title,
      project_id,
      linked_task_id,
      owner_id,
      suite,
      module,
      sprint_name,
      priority,
      status,
      automation,
      tags,
      preconditions,
      steps,
      linked_items,
      execution_history
    )
    SELECT
      'Audit homepage keyboard navigation and landmarks',
      website_redesign_project_id,
      task_accessibility_review_id,
      mike_id,
      'Core Experience',
      'Accessibility',
      'Sprint 1',
      'Critical',
      'Ready',
      'Manual',
      '["accessibility", "keyboard", "homepage"]'::jsonb,
      '["Preview deployment is available.", "Latest navigation and homepage changes are merged."]'::jsonb,
      '[
        {"id":1,"action":"Navigate the homepage using keyboard only.","expected":"All interactive elements are reachable in a logical order."},
        {"id":2,"action":"Inspect the page structure with a screen reader or accessibility tree.","expected":"Landmarks and headings are announced in the correct hierarchy."},
        {"id":3,"action":"Verify visible focus states on navigation, hero CTA, and footer links.","expected":"Every interactive control has a clear visible focus indicator."}
      ]'::jsonb,
      jsonb_build_array(
        jsonb_build_object('id', COALESCE(task_accessibility_review_id::text, 'accessibility-review-task'), 'type', 'Bug', 'title', 'Accessibility Review')
      ),
      '[
        {
          "id":"exec-web-1",
          "cycle":"Accessibility Sweep",
          "status":"Failed",
          "tester":"Mike Johnson",
          "executedAt":"2026-04-06T09:15:00.000Z",
          "note":"Footer links lose visible focus on tablet width."
        }
      ]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_cases
      WHERE project_id = website_redesign_project_id
        AND title = 'Audit homepage keyboard navigation and landmarks'
    );

    INSERT INTO test_cases (
      title,
      project_id,
      linked_task_id,
      owner_id,
      suite,
      module,
      sprint_name,
      priority,
      status,
      automation,
      tags,
      preconditions,
      steps,
      linked_items,
      execution_history
    )
    SELECT
      'Check CMS content migration renders approved blocks',
      website_redesign_project_id,
      NULL,
      sarah_id,
      'Regression Pack',
      'CMS Pages',
      'Sprint 1',
      'Medium',
      'Passed',
      'Automated',
      '["cms", "rendering", "regression"]'::jsonb,
      '["Seed CMS content is loaded in staging.", "Approved content block library is available."]'::jsonb,
      '[
        {"id":1,"action":"Open each migrated CMS page in staging.","expected":"Approved content blocks render in the correct order without layout regressions."},
        {"id":2,"action":"Verify image, rich text, and CTA blocks display expected content.","expected":"All migrated block types preserve styling and content."}
      ]'::jsonb,
      '[]'::jsonb,
      '[
        {
          "id":"exec-web-2",
          "cycle":"CMS Smoke Pack",
          "status":"Passed",
          "tester":"Sarah Wilson",
          "executedAt":"2026-04-04T13:00:00.000Z",
          "note":"Migrated pages rendered correctly in the preview environment."
        }
      ]'::jsonb
    WHERE NOT EXISTS (
      SELECT 1
      FROM test_cases
      WHERE project_id = website_redesign_project_id
        AND title = 'Check CMS content migration renders approved blocks'
    );
  END IF;
END $$;
