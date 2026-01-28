# Task Tracker

A full-stack task management application built with React TypeScript frontend and Node.js backend.

## Project Structure

```
Task-Tracker/
├── Backend/             # Node.js/TypeScript API server
├── UI/                  # React TypeScript frontend
├── DB/                  # Database migrations and schema
├── docker-compose.yml   # Docker services configuration
└── README.md           # This file
```

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- Docker & Docker Compose
- Yarn package manager

## Quick Start

### 1. Clone Repository

```bash
git clone <repository-url>
cd Task-Tracker
```

### 2. Environment Setup

Copy environment configuration:
```bash
cp .env.example .env
```

Update `.env` with your configuration:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=task_tracker_db
DB_USER=postgres
DB_PASSWORD=postgres

# Backend Configuration
NODE_ENV=development
BACKEND_PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_PORT=3001
VITE_API_BASE_URL=http://localhost:3000

# Docker Configuration
POSTGRES_DB=task_tracker_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_PORT=5433
```

### 3. Start with Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Manual Setup

#### Backend Setup
```bash
cd Backend
yarn install
docker-compose up -d postgres
docker-compose up migrator
yarn dev
```

#### Frontend Setup
```bash
cd UI
yarn install
yarn dev
```

## Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs
- **PostgreSQL**: localhost:5433

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Role-based access control (Admin, Member, Viewer)
- Protected routes

### Task Management
- Create, read, update, delete tasks
- Task status tracking (To Do, In Progress, Done)
- Priority levels (Low, Medium, High)
- Due date management
- Task assignment to team members
- Pagination (5 items per page)

### Project Management
- Organize tasks by projects
- Project ownership and access control
- Project statistics and insights

### Team Management
- User management interface
- Role-based filtering
- Team performance metrics
- Member invitation system

### Dashboard
- Task overview and statistics
- Filtering by status, priority, project
- Real-time data updates
- Responsive design

## Technology Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT tokens with bcrypt
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI
- **Migrations**: Flyway

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Material Symbols
- **Routing**: React Router
- **State**: React Context API
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 16
- **Package Manager**: Yarn with node-modules linker

## Development

### Backend Development
```bash
cd Backend
yarn dev          # Start development server
yarn build        # Build for production
yarn test         # Run tests
yarn lint         # Run ESLint
```

### Frontend Development
```bash
cd UI
yarn dev          # Start development server
yarn build        # Build for production
yarn preview      # Preview production build
yarn lint         # Run ESLint
yarn type-check   # TypeScript checking
```

### Database Management
```bash
# Start database and run migrations
cd DB
./up.sh

# Stop database
./down.sh

# Local development environment
./env/local/_up.sh    # Start local DB with migrations
./env/local/_down.sh  # Stop local DB

# Reset database (from DB folder)
docker-compose down
docker-compose up -d
```

## API Documentation

Swagger documentation is available at: http://localhost:3000/api-docs

### Key Endpoints
- `POST /api/auth/login` - User authentication
- `GET /api/tasks` - Get tasks with pagination
- `POST /api/tasks` - Create new task
- `GET /api/dashboard/summary` - Dashboard statistics
- `GET /api/users` - Team management

## Default Users

After running migrations, these test users are available:

| Email | Password | Role |
|-------|----------|------|
| giri.gk@company.com | password123 | Admin |
| giridharan.gk@company.com | password123 | Member |
| mike.johnson@company.com | password123 | Member |
| sarah.wilson@company.com | password123 | Viewer |

**Quick Test Login:**
- **Admin Access**: giri.gk@company.com / password123
- **Member Access**: giridharan.gk@company.com / password123

## Production Deployment

### Backend
1. Set production environment variables
2. Build the application: `yarn build`
3. Run database migrations
4. Start the server: `yarn start`

### Frontend
1. Update API base URL in environment
2. Build the application: `yarn build`
3. Deploy the `dist/` folder to hosting service

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure PostgreSQL is running on port 5433
   - Check database credentials in `.env`
   - Run `docker-compose up -d postgres`

2. **Migration Failures**
   - Check migration syntax and order
   - Reset database if needed
   - Ensure proper user permissions

3. **Frontend API Errors**
   - Verify backend is running on port 3000
   - Check CORS configuration
   - Confirm API base URL in frontend env

4. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT secret configuration
   - Verify token expiration settings

### Getting Help

- Check individual README files in Backend/ and UI/ folders
- Review API documentation at /api-docs
- Check Docker logs: `docker-compose logs`
- Verify environment configuration

## License

This project is licensed under the MIT License.