# Task Tracker — Database

PostgreSQL 12+ database managed with Flyway. Schema migrations are in the `V1xxx` series; seed/demo data migrations are in the `V2xxx` series. Both series run as independent Flyway tracks so their version sequences never collide.

---

## Structure

```
DB/
├── migrations/
│   ├── schema/         # V1xxx — DDL (tables, indexes, triggers, enums)
│   └── seeder/         # V2xxx — DML (demo/seed data)
├── env/
│   └── local/          # Local-only docker-compose + helper scripts
├── flyway.conf         # Flyway configuration (dual-track)
├── docker-compose.yml  # postgres + migrator services
├── run-migrations.sh   # Runs both tracks in order
├── up.sh               # Start production DB
└── down.sh             # Stop production DB
```

---

## Quick Start (Local)

```bash
cd DB
docker-compose up -d postgres       # Start PostgreSQL on port 5432
docker-compose up migrator          # Run all migrations
```

Default connection:
- Host: `localhost` · Port: `5432`
- Database: `task_tracker` · User: `postgres` · Password: `password`

To run only schema migrations or only seed migrations, use `run-migrations.sh` directly.

---

## Flyway Tracks

| Track | Folder | History table | Version range |
|-------|--------|---------------|---------------|
| Schema | `migrations/schema/` | `flyway_schema_history_schema` | V1001 – V1xxx |
| Seeder | `migrations/seeder/` | `flyway_schema_history_seeder` | V2001 – V2xxx |

Running two separate tracks means you can bump a seed version without touching the schema sequence (and vice versa).

---

## Migration History

### Schema Migrations (V1xxx)

| Version | File | What it does |
|---------|------|--------------|
| V1001 | `create_base_tables` | Core tables: `users`, `projects`, `tasks`, `subtasks`, `comments`, `labels`, `task_labels` |
| V1002 | `create_indexes` | Performance indexes on FK columns and status fields |
| V1003 | `create_triggers` | `update_updated_at_column()` trigger function + triggers on all tables |
| V1004 | `create_projects_tables` | `project_members` table, project priority/date columns, triggers |
| V1005 | `add_task_start_date` | `start_date` column on `tasks` |
| V1006 | `create_project_files_table` | `project_files` — file storage for projects |
| V1007 | `create_pr_commit_tables` | `pull_requests`, `commits` — VCS integration |
| V1008 | `create_user_metadata_table` | `user_metadata` — bio, location, social links |
| V1009 | `create_audit_log_table` | `audit_logs` — full activity trail |
| V1010 | `Create_chat_groups_table` | `chat_groups` — group definitions |
| V1011 | `Create_chat_messages_table` | `chat_messages` — message content + encryption flag |
| V1012 | `Create_chat_group_members_table` | `chat_group_members` — membership |
| V1013 | `Insert_default_chat_groups` | Seed default system chat groups |
| V1014 | `create_auth_otps_table` | `auth_otps` — OTP codes, purpose, expiry, attempt counter |
| V1015 | `create_auth_password_resets_table` | `auth_password_resets` — secure reset tokens |
| V1016 | `create_user_preferences_tables` | `user_preferences` — notification and display settings |
| V1017 | `create_user_invitations_table` | `user_invitations` — email invite tokens and status |
| V1018 | `create_chat_message_reads_table` | `chat_message_reads` — read receipts |
| V1019 | `normalize_user_roles` | Enforce role ENUM consistency on `users` |
| V1020 | `projects_description_required` | Make `projects.description` NOT NULL |
| V1021 | `tasks_description_required` | Make `tasks.description` NOT NULL |
| V1022 | `create_project_confidential_access_requests` | `project_confidential_access_requests` table |
| V1023 | `backfill_project_task_access` | Backfill project access for pre-existing tasks |
| V1024 | `invite` | Invitation refinements (columns, constraints) |
| V1025 | `create_cron_tables` | `cron_types`, `crons`, `cron_executions`, `cron_retries` — scheduler infrastructure |
| V1026 | `updating_cron_table` | Add `cron_execution_status` ENUM; convert `cron_executions.status` to ENUM; add `updated_at` to cron tables |
| V1027 | `create_organization_table` | `organizations`, `organization_members` — multi-tenant support |
| V1028 | `updating_admin_column_org_table` | `is_admin` boolean on `organization_members` |
| V1029 | `add_org_code_to_invites` | `org_code` column on `user_invitations` |
| V1030 | `make_invite_org_codes_unique` | Unique constraint on org invite codes |
| V1031 | `create_project_access_config_table` | `project_access_config` — fine-grained access control settings |
| V1032 | `create_defects_and_task_links` | `defects` table + `task_links` for task relationships |
| V1033 | `create_test_cases_table` | `test_cases` — test case steps, expected result, status |
| V1034 | `create_sprints_and_link_tasks` | `sprints` table + sprint–task link table |
| V1035 | `create_test_case_modules_table` | `test_case_modules` — grouping test cases by feature area |
| V1036 | `create_test_plans_table` | `test_plans` — coverage and scope metadata |
| V1037 | `create_test_runs_table` | `test_runs` — execution records with pass/fail counts |
| V1038 | `create_test_case_suites_table` | `test_case_suites` — suite organization |
| V1039 | `create_auth_refresh_tokens_table` | `auth_refresh_tokens` — hashed refresh token tracking |
| V1040 | `add_task_issue_type` | `issue_type` column on `tasks` (bug / feature / task) |
| V1041 | `create_task_files_table` | `task_files` — file attachments on tasks |
| V1042 | `add_missing_subtasks_columns` | Backfill missing columns on `subtasks` |
| V1043 | `expand_task_status_workflow` | Extend task status ENUM: To Do, In Progress, In Review, Done, Cancelled |
| V1044 | `normalize_sprint_links_across_entities` | Sprint associations for test cases |
| V1045 | `split_user_full_name` | Split `full_name` into `first_name` + `last_name` on `users` |

### Seeder Migrations (V2xxx)

| Version | File | What it seeds |
|---------|------|---------------|
| V2001 | `seed_base_data` | Demo users, base project, initial records |
| V2002 | `seed_tasks_data` | Sample tasks across multiple statuses |
| V2003 | `seed_projects_data` | Demo projects with members |
| V2004 | `seed_organization_data` | Demo organizations |
| V2005 | `seed_sprints_data` | Sample sprints with task assignments |
| V2006 | `refresh_seeded_demo_data` | Reset/re-seed all demo data |
| V2007 | `seed_test_case_suites_and_modules` | Test case suites and modules |
| V2008 | `seed_test_cases_data` | Sample test cases |
| V2009 | `update_subtasks_with_assignees` | Add assignees to existing seed subtasks |
| V2010 | `refresh_seeded_quality_data` | Refresh QA demo data (defects, test runs) |

---

## Core Schema Overview

### Users & Auth

```
users               id, first_name, last_name, email, password_hash, avatar_url, role
auth_otps           id, user_id, code, purpose, expires_at, attempts
auth_password_resets  id, user_id, token, expires_at
auth_refresh_tokens id, user_id, token_hash, expires_at
user_metadata       user_id, bio, location, website, social links
user_preferences    user_id, notification settings, display settings
```

### Organizations & Teams

```
organizations       id, name, code, created_at
organization_members  org_id, user_id, is_admin
user_invitations    id, email, token, org_code, status
```

### Projects & Tasks

```
projects            id, name, description, owner_id, status, priority, start_date, end_date
project_members     id, project_id, user_id, role
project_files       id, project_id, file_url, name, size
project_access_config  project_id, access settings

tasks               id, project_id, title, description, status, priority, issue_type,
                    assignee_id, creator_id, sprint_id, start_date, due_date
subtasks            id, task_id, title, is_completed, position
comments            id, task_id, user_id, content
labels              id, name, color_hex
task_labels         task_id, label_id
task_files          id, task_id, file_url, name
task_links          id, source_task_id, target_task_id, link_type
```

### Sprints

```
sprints             id, project_id, name, status, goal, start_date, end_date
sprint_tasks        sprint_id, task_id
```

### QA & Defects

```
test_case_suites    id, project_id, name
test_case_modules   id, suite_id, name
test_cases          id, suite_id, module_id, title, steps, expected_result, status
test_plans          id, project_id, name, scope
test_runs           id, plan_id, status, passed_count, failed_count, executed_at
defects             id, project_id, title, description, priority, status, assigned_to, created_by
```

### Chat

```
chat_groups         id, name, type
chat_group_members  group_id, user_id
chat_messages       id, group_id, user_id, content, encrypted
chat_message_reads  message_id, user_id, read_at
```

### Scheduler (Cron)

```
cron_types          id, name, description
crons               id, type_id, name, schedule_expression, is_active, next_run_at, last_run_at
cron_executions     id, cron_id, status (cron_execution_status ENUM), retry_count, started_at, ended_at, error_message
cron_retries        id, execution_id, retry_count, status, retry_time
```

`cron_execution_status` ENUM values: `pending`, `running`, `success`, `failed`, `retrying`

### Audit

```
audit_logs          id, user_id, action, entity_type, entity_id, metadata, created_at
```

---

## Adding a New Migration

### Schema change (next V1xxx)

```sql
-- DB/migrations/schema/V1046__your_description.sql
ALTER TABLE tasks ADD COLUMN estimated_hours NUMERIC(5,2);
```

Use `IF NOT EXISTS` / `IF EXISTS` guards for any `CREATE TYPE`, `ADD COLUMN`, or `DROP COLUMN` so the migration is safe to retry after a partial failure.

### Seed data (next V2xxx)

```sql
-- DB/migrations/seeder/V2011__your_description.sql
INSERT INTO labels (id, name, color_hex) VALUES (gen_random_uuid(), 'Backend', '#3B82F6');
```

### Run migrations

```bash
docker-compose up migrator
```

---

## Flyway Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `type "X" already exists` | ENUM created without guard | Wrap `CREATE TYPE` in a `DO $$ IF NOT EXISTS ... $$` block (see V1026 for pattern) |
| `relation "X" already exists` | Table created without `IF NOT EXISTS` | Add `IF NOT EXISTS` to `CREATE TABLE` |
| `checksum mismatch` | Migration file edited after it ran | Never edit committed migration files — create a new one instead |
| `outOfOrder` warning | Migration version lower than current applied | Enable `outOfOrder=true` in `flyway.conf` only for deliberate backfills |

---

## Troubleshooting

- **Docker volume issues** — Run `docker-compose down -v` to wipe the volume and start fresh (destroys all data).
- **Connection refused** — Ensure `postgres` container is healthy before `migrator` starts (`depends_on` with `condition: service_healthy` is set in `docker-compose.yml`).
- **Partial migration failure** — Flyway rolls back on error. Fix the SQL, then re-run `docker-compose up migrator`.
