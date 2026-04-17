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
./env/local/_up.sh
```

This local stack uses [env/local/local.env](/Users/kgiridharan/Documents/Giri/Task-Tracker/DB/env/local/local.env:1) and starts:
- Postgres on `localhost:5433`
- The Flyway migrator against `task_tracker_local`

Default connection:
- Host: `localhost`
- Port: `5433`
- Database: `task_tracker_local`
- User: `postgres`
- Password: `password`

Stop it with:

```bash
./env/local/_down.sh
```

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
| V1027 | `create_organization_table` | `organization` table, organization code sequence, and `users.organization_id` |
| V1028 | `updating_admin_column_org_table` | Add required `admin` foreign key to `organization` and backfill from `created_by` |
| V1029 | `add_org_code_to_invites` | Add `org_code` column to `invites` |
| V1030 | `make_invite_org_codes_unique` | Unique constraint on org invite codes |
| V1031 | `create_project_access_config_table` | `config` table for project access scope and approval settings |
| V1032 | `create_defects_and_task_links` | `defects` table + `task_links` for task relationships |
| V1033 | `create_test_cases_table` | `test_cases` with suite/module names, JSONB steps, linked items, and execution history |
| V1034 | `create_sprints_and_link_tasks` | `sprints` table and direct `tasks.sprint_id` relationship |
| V1035 | `create_test_case_modules_table` | `test_case_modules` grouped by project and owner |
| V1036 | `create_test_plans_table` | `test_plans` with project, sprint, status, owner, and summary metrics |
| V1037 | `create_test_runs_table` | `test_runs` linked to plans with assignee, build, environment, and execution counts |
| V1038 | `create_test_case_suites_table` | `test_case_suites` grouped by project and owner |
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

### Organizations & Invites

```
organization        id, name, org_code, slug, admin, created_by, status
users               organization_id
invites             id, email, invite_code, org_code, status
user_invitations    id, email, token, full_name, status
```

### Projects & Tasks

```
projects            id, name, description, owner_id, status, priority, start_date, end_date
project_members     id, project_id, user_id, role
project_files       id, project_id, file_url, name, size
config              project_id, organization_id, access_scope, approval_enabled

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
sprints             id, project_id, name, status, goal, release, squad, start_date, end_date
tasks               sprint_id
test_cases          sprint_id, sprint_name
defects             sprint_id, sprint_name
```

### QA & Defects

```
test_case_suites    id, project_id, name, owner_id
test_case_modules   id, project_id, name, owner_id
test_cases          id, project_id, title, suite, module, steps, status, linked_task_id, sprint_id
test_plans          id, project_id, sprint_id, name, status, owner_id, totals
test_runs           id, plan_id, assignee_id, status, environment, executed_at, totals
defects             id, project_id, title, severity, priority, status, linked_task_id, sprint_id
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
cron_types          type_id, type_name, description
crons               cron_id, type_id, cron_name, schedule_expression, is_active, next_run_at, last_run_at
cron_executions     execution_id, cron_id, status (cron_execution_status ENUM), retry_count, started_at, ended_at, error_message
cron_retries        retry_id, execution_id, retry_count, status, retry_time
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
./env/local/_up.sh
```

---

## Flyway Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `type "X" already exists` | ENUM created without guard | Wrap `CREATE TYPE` in a `DO $$ IF NOT EXISTS ... $$` block (see V1026 for pattern) |
| `relation "X" already exists` | Table created without `IF NOT EXISTS` | Add `IF NOT EXISTS` to `CREATE TABLE` |
| `checksum mismatch` | Migration file edited after it ran | Never edit committed migration files — create a new one instead |
| Separate schema/seed numbering | Using one shared Flyway history | Run migrations through `run-migrations.sh`, which keeps schema and seed in separate history tables |

---

## Troubleshooting

- **Missing local env file** — Ensure [env/local/local.env](/Users/kgiridharan/Documents/Giri/Task-Tracker/DB/env/local/local.env:1) exists before running `./env/local/_up.sh`.
- **Docker volume issues** — Run `./env/local/_down.sh` and then `docker volume rm` on the local DB volume if you need a full reset.
- **Connection refused** — Ensure the local Postgres container is up on port `5433` before the migrator starts.
- **Partial migration failure** — Flyway rolls back on error. Fix the SQL, then rerun `./env/local/_up.sh`.
