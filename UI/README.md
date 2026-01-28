# Task Tracker Frontend

A modern React TypeScript frontend for task management with Vite, Tailwind CSS, and Material Icons.

## Prerequisites

- Node.js (v18 or higher)
- Yarn package manager
- Task Tracker Backend running on `http://localhost:3000`

## Setup & Installation

### 1. Clone and Install Dependencies

```bash
cd UI
yarn install
```

### 2. Environment Configuration

Create environment file:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Start Development Server

```bash
yarn dev
```

The application will be available at `http://localhost:3001`

## Available Scripts

- `yarn dev` - Start development server with hot reload
- `yarn build` - Build production bundle
- `yarn preview` - Preview production build
- `yarn lint` - Run ESLint
- `yarn type-check` - Run TypeScript type checking

## Features

### Authentication

- **User Registration** - Create new account with email/password
- **User Login** - Secure JWT-based authentication
- **Protected Routes** - Automatic redirect for unauthenticated users
- **Persistent Sessions** - Token stored in localStorage

### Dashboard

- **Task Overview** - Summary statistics and metrics
- **Task List** - Paginated task display (5 items per page)
- **Filtering** - Filter by status, priority, and project
- **Real-time Updates** - Automatic data refresh

### Task Management

- **Create Tasks** - Modal form with project assignment
- **Task Details** - Full task view with status updates
- **Status Management** - Dropdown and quick complete actions
- **Priority Levels** - Visual priority indicators
- **Due Dates** - Date formatting with overdue detection

### Team Management

- **User Listing** - Team member overview
- **Role Filtering** - Filter by Admin, Member, Viewer
- **Statistics** - Team performance metrics
- **User Actions** - Member management interface

### UI/UX

- **Responsive Design** - Mobile-first approach
- **Material Icons** - Consistent iconography
- **Tailwind CSS** - Utility-first styling
- **Loading States** - Skeleton screens and spinners
- **Error Handling** - User-friendly error messages

## Project Structure

```
UI/
├── public/
│   └── index.html       # HTML template
├── src/
│   ├── components/      # Reusable components
│   │   ├── CreateTaskModal.tsx
│   │   ├── TaskDetails.tsx
│   │   └── TeamManagement.tsx
│   ├── contexts/        # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── ComingSoon.tsx
│   ├── services/        # API services
│   │   ├── auth.ts
│   │   └── dashboard.ts
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── package.json
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration
```

## Pages & Routes

- `/` - Dashboard (protected)
- `/login` - User login
- `/register` - User registration
- `/task/:id` - Task details modal
- `/team` - Team management
- `/coming-soon` - Placeholder for incomplete features

## Components

### Authentication Context

- Global authentication state management
- JWT token handling
- User session persistence
- Protected route wrapper

### Dashboard

- Task list with pagination
- Filter controls (status, priority)
- Summary statistics
- Create task modal

### Task Details

- Full task information display
- Status update dropdown
- Priority and due date display
- Modal overlay interface

### Team Management

- User listing with role badges
- Filter tabs by role
- Statistics cards
- Export and invite actions

## API Integration

### Authentication Service

```typescript
// Login user
authAPI.login(email, password);

// Register user
authAPI.register(userData);

// Get current user
authAPI.getCurrentUser();
```

### Dashboard Service

```typescript
// Get dashboard summary
dashboardAPI.getSummary();

// Get tasks with pagination
tasksAPI.getTasks({ page: 1, limit: 5, status: "In Progress" });

// Update task
tasksAPI.updateTask(taskId, { status: "Done" });
```

## Styling

### Tailwind CSS

- Utility-first CSS framework
- Custom color palette
- Responsive breakpoints
- Dark mode support (prepared)

### Material Icons

- Google Material Symbols
- Consistent iconography
- Outlined and filled variants
- Proper font loading

### Design System

- **Colors**: Blue primary, slate secondary
- **Typography**: Inter font family
- **Spacing**: 4px base unit
- **Shadows**: Subtle elevation
- **Borders**: Rounded corners

## State Management

### React Context

- Authentication state
- User information
- Token management

### Local State

- Component-specific state
- Form handling
- UI interactions

### API State

- Loading states
- Error handling
- Data caching

## Development

### Adding New Pages

1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Update navigation links
4. Add to protected routes if needed

### Adding New Components

1. Create component in `src/components/`
2. Export from component file
3. Import where needed
4. Add TypeScript interfaces

### API Integration

1. Add service functions in `src/services/`
2. Define TypeScript interfaces
3. Handle loading and error states
4. Update components to use service

## Production Build

1. Build the application:

```bash
yarn build
```

2. Preview the build:

```bash
yarn preview
```

3. Deploy the `dist/` folder to your hosting service

## Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (default: http://localhost:3000)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- **Code Splitting** - Automatic route-based splitting
- **Tree Shaking** - Unused code elimination
- **Asset Optimization** - Image and font optimization
- **Lazy Loading** - Component lazy loading
- **Bundle Analysis** - Build size monitoring

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Ensure backend is running on port 3000
   - Check CORS configuration
   - Verify API base URL

2. **Authentication Issues**
   - Clear localStorage tokens
   - Check JWT token expiration
   - Verify backend authentication

3. **Build Errors**
   - Run `yarn type-check` for TypeScript errors
   - Check import paths
   - Verify environment variables

### Development Tips

- Use React DevTools for debugging
- Check Network tab for API calls
- Use TypeScript strict mode
- Follow component naming conventions
