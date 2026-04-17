ALTER TABLE users
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) NOT NULL DEFAULT '';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'full_name'
  ) THEN
    UPDATE users
    SET
      first_name = COALESCE(
        NULLIF(first_name, ''),
        NULLIF(split_part(trim(full_name), ' ', 1), ''),
        email
      ),
      last_name = CASE
        WHEN COALESCE(NULLIF(last_name, ''), '') <> '' THEN last_name
        WHEN position(' ' in trim(full_name)) > 0
          THEN trim(substring(trim(full_name) from position(' ' in trim(full_name)) + 1))
        ELSE ''
      END
    WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL;
  ELSE
    UPDATE users
    SET
      first_name = COALESCE(NULLIF(first_name, ''), email),
      last_name = COALESCE(last_name, '')
    WHERE first_name IS NULL OR first_name = '' OR last_name IS NULL;
  END IF;
END $$;

ALTER TABLE users
ALTER COLUMN first_name SET NOT NULL;

ALTER TABLE users
DROP COLUMN IF EXISTS full_name;
