# Task Tracker Backend

A Node.js/TypeScript backend API for task management with Express, PostgreSQL, and Sequelize.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Docker & Docker Compose
- Yarn package manager

## Setup & Installation

### 1. Clone and Install Dependencies

```bash
cd Backend
yarn install
```

### 2. Environment Configuration

Create environment file:
```bash
cp config/env/.env.example config/env/.env
```

Update `.env` with your configuration:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=task_tracker_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
```

### 3. Database Setup

Start PostgreSQL with Docker:
```bash
docker-compose up -d postgres
```

Run database migrations:
```bash
docker-compose up migrator
```

### 4. Start Development Server

```bash
yarn dev
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build production bundle
- `yarn start` - Start production server
- `yarn test` - Run tests
- `yarn lint` - Run ESLint
- `yarn format` - Format code with Prettier

## API Documentation

Swagger documentation available at: `http://localhost:3000/api-docs`

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Task Endpoints

- `GET /api/tasks` - Get tasks with pagination and filters
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task by ID
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Project Endpoints

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project by ID
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### User Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

### Dashboard Endpoints

- `GET /api/dashboard/summary` - Get dashboard statistics

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `full_name` (String)
- `email` (String, Unique)
- `password_hash` (String)
- `avatar_url` (String, Optional)
- `role` (Enum: Admin, Member, Viewer)
- `created_at`, `updated_at` (Timestamps)

### Projects
- `id` (UUID, Primary Key)
- `name` (String)
- `description` (Text, Optional)
- `owner_id` (UUID, Foreign Key to Users)
- `status` (Enum: Active, Archived)
- `created_at` (Timestamp)

### Tasks
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key to Projects)
- `title` (String)
- `description` (Text, Optional)
- `status` (Enum: To Do, In Progress, Done)
- `priority` (Enum: Low, Medium, High)
- `due_date` (Date, Optional)
- `creator_id` (UUID, Foreign Key to Users)
- `assignee_id` (UUID, Foreign Key to Users, Optional)
- `created_at`, `updated_at` (Timestamps)

## Features

- **JWT Authentication** - Secure user authentication
- **Role-based Access Control** - Admin, Member, Viewer roles
- **Task Management** - CRUD operations with filtering and pagination
- **Project Management** - Organize tasks by projects
- **User Management** - Team member management
- **Dashboard Analytics** - Task statistics and insights
- **API Documentation** - Swagger/OpenAPI documentation
- **Database Migrations** - Flyway migration system
- **Input Validation** - Request validation with express-validator
- **Error Handling** - Centralized error handling
- **CORS Support** - Cross-origin resource sharing
- **Pagination** - Efficient data pagination (5 items per page)

## Project Structure

```
Backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── validators/      # Input validation
│   ├── config/          # Configuration files
│   ├── docs/            # API documentation
│   └── utils/           # Utility functions
├── config/
│   └── env/             # Environment files
├── DB/
│   └── migrations/      # Database migrations
├── docker-compose.yml   # Docker services
└── package.json
```

## Docker Services

- **postgres** - PostgreSQL database (port 5433)
- **migrator** - Flyway migration runner
- **backend** - Node.js API server (port 3000)

## Development

### Adding New Features

1. Create model in `src/models/`
2. Add migration in `DB/migrations/schema/`
3. Create service in `src/services/`
4. Add controller in `src/controllers/`
5. Define routes in `src/routes/`
6. Add validation in `src/validators/`
7. Update Swagger docs in `src/docs/swagger/`

### Database Migrations

Create new migration:
```bash
# Schema migration
DB/migrations/schema/V1005__add_new_table.sql

# Data seeding
DB/migrations/seeder/V2003__seed_new_data.sql
```

Run migrations:
```bash
docker-compose up migrator
```

## Production Deployment

1. Build the application:
```bash
yarn build
```

2. Set production environment variables
3. Run database migrations
4. Start the server:
```bash
yarn start
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running on port 5433
   - Check database credentials in `.env`

2. **Migration Failures**
   - Check migration syntax
   - Ensure proper migration order

3. **Authentication Issues**
   - Verify JWT_SECRET is set
   - Check token expiration settings

### Logs

Application logs are available in the console during development. For production, configure proper logging with winston or similar.