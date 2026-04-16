# Task Tracker Database

PostgreSQL database setup with Flyway migrations following the same pattern as the HRIS seeder.

## Structure

```
DB/
├── migrations/
│   ├── schema/          # V1xxx - Database schema
│   │   ├── V1001__create_base_tables.sql
│   │   ├── V1002__create_indexes.sql
│   │   └── V1003__create_triggers.sql
│   └── seeder/          # V2xxx - Sample data
│       ├── V2001__seed_base_data.sql
│       └── V2002__seed_tasks_data.sql
├── env/
│   ├── local/
│   │   ├── docker-compose.local.yml
│   │   ├── local.env
│   │   ├── _up.sh
│   │   └── _down.sh
│   └── Dockerfile
├── flyway.conf
├── run-migrations.sh
├── docker-compose.yml
├── up.sh
└── down.sh
```

## Database Schema

- **users** - Team members with roles (Admin, Member, Viewer)
- **projects** - Task organization and grouping
- **tasks** - Core task management with status, priority, and assignments
- **subtasks** - Checklist items for tasks
- **comments** - Activity log and task discussions
- **labels** - Categorization tags with colors
- **task_labels** - Many-to-many relationship between tasks and labels

## Setup

### Local Development

1. Start local environment:
```bash
./env/local/_up.sh
```

2. Stop local environment:
```bash
./env/local/_down.sh
```

### Production

1. Start services:
```bash
./up.sh
```

2. Stop services:
```bash
./down.sh
```

## Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: task_tracker (or task_tracker_local for local env)
- **User**: postgres
- **Password**: password

## Migration Numbering

Schema and seeder now run as two separate Flyway tracks.

- `schema/` uses its own history table: `flyway_schema_history_schema`
- `seeder/` uses its own history table: `flyway_schema_history_seeder`
- Keep schema migrations in the `V1xxx` range.
- Keep seed migrations in the `V2xxx` range.

This removes the need to maintain one shared version sequence across both folders.

## How Migrations Run

Use `run-migrations.sh` instead of running one Flyway command over both folders together.

- First pass: `schema/`
- Second pass: `seeder/`

That keeps schema changes and sample/demo data versioning independent while still applying them in a predictable order.
