-- Seed sample sprint data and link a few existing tasks without overwriting
DO $$
DECLARE
  brand_identity_project_id UUID;
  q4_marketing_project_id UUID;
  brand_owner_id UUID;
  marketing_owner_id UUID;
  brand_sprint_id UUID;
  marketing_sprint_id UUID;
BEGIN
  -- Find existing seeded projects
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

  -- Seed a sprint for Brand Identity if the project exists
  IF brand_identity_project_id IS NOT NULL THEN
    SELECT id
    INTO brand_sprint_id
    FROM sprints
    WHERE project_id = brand_identity_project_id
      AND name = 'Sprint 24 Brand Foundation'
    LIMIT 1;

    IF brand_sprint_id IS NULL THEN
      INSERT INTO sprints (
        name,
        goal,
        release,
        squad,
        project_id,
        owner_id,
        capacity,
        start_date,
        end_date,
        status
      )
      VALUES (
        'Sprint 24 Brand Foundation',
        'Finalize the core identity system and push review-ready assets to QA.',
        'Brand Refresh',
        'Design Ops',
        brand_identity_project_id,
        brand_owner_id,
        26,
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '9 days',
        'Active'
      )
      RETURNING id INTO brand_sprint_id;
    END IF;

    UPDATE tasks
    SET sprint_id = brand_sprint_id
    WHERE project_id = brand_identity_project_id
      AND sprint_id IS NULL
      AND title IN (
        'Design System Setup',
        'Logo Concepts',
        'Typography Selection'
      );
  END IF;

  -- Seed a sprint for Q4 Marketing if the project exists
  IF q4_marketing_project_id IS NOT NULL THEN
    SELECT id
    INTO marketing_sprint_id
    FROM sprints
    WHERE project_id = q4_marketing_project_id
      AND name = 'Sprint 18 Campaign Launch Prep'
    LIMIT 1;

    IF marketing_sprint_id IS NULL THEN
      INSERT INTO sprints (
        name,
        goal,
        release,
        squad,
        project_id,
        owner_id,
        capacity,
        start_date,
        end_date,
        status
      )
      VALUES (
        'Sprint 18 Campaign Launch Prep',
        'Prepare campaign content, research, and QA handoff for the Q4 launch plan.',
        'Q4 Campaign',
        'Growth Marketing',
        q4_marketing_project_id,
        marketing_owner_id,
        30,
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '12 days',
        'Active'
      )
      RETURNING id INTO marketing_sprint_id;
    END IF;

    UPDATE tasks
    SET sprint_id = marketing_sprint_id
    WHERE project_id = q4_marketing_project_id
      AND sprint_id IS NULL
      AND title IN (
        'Campaign Strategy',
        'Social Media Content',
        'Email Templates'
      );
  END IF;
END $$;
