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

Flyway uses a single global version order across all configured locations.
That means versions in `schema/` and `seeder/` still share the same sequence.

- Use a version greater than the current highest applied migration.
- Do not add a new `V1xxx` migration after `V2xxx` files have already been applied in production unless you intentionally rely on out-of-order execution.
