import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import TestCases from "./pages/TestCases";
import CreateTestCase from "./pages/CreateTestCase";
import SprintBoards from "./pages/SprintBoards";
import TestPlans from "./pages/TestPlans";
import TestRuns from "./pages/TestRuns";
import TestReports from "./pages/TestReports";
import TestTraceability from "./pages/TestTraceability";
import TestDefects from "./pages/TestDefects";
import RaiseDefect from "./pages/RaiseDefect";
import Analytics from "./pages/Analytics";
import ActivityLog from "./pages/ActivityLog";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ChangePassword from "./pages/ChangePassword";
import NotFound from "./pages/NotFound";
import TaskDetails from "./components/TaskDetails";
import ComingSoon from "./components/ComingSoon";
import TeamManagement from "./components/TeamManagement";
import Layout from "./components/Layout";
import AiMonitoring from "./pages/AiMonitoring";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import RingLoader from "./components/RingLoader";
import { hasMinimumWorkspaceRole, type WorkspaceRole } from "./types/roles";
import OrganizationOnboarding from "./pages/OrganizationOnboarding";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RingLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.organization) {
    return <Navigate to="/organization/onboarding" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RingLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <>{children}</>;
  }

  return <Navigate to={user.organization ? "/dashboard" : "/organization/onboarding"} replace />;
}

function OrganizationOnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RingLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.organization) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RoleProtectedRoute({
  minRole,
  children,
}: {
  minRole: WorkspaceRole;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RingLoader size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasMinimumWorkspaceRole(user.role, minRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <PublicRoute>
            <ChangePassword />
          </PublicRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route
        path="/organization/onboarding"
        element={
          <OrganizationOnboardingRoute>
            <OrganizationOnboarding />
          </OrganizationOnboardingRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="sprint-board" element={<SprintBoards />} />
        <Route path="test-cases" element={<TestCases />} />
        <Route path="test-cases/create" element={<CreateTestCase />} />
        <Route path="sprint-dev-board" element={<Navigate to="/sprint-board" replace />} />
        <Route path="sprint-qa-board" element={<Navigate to="/sprint-board" replace />} />
        <Route path="test-plans" element={<TestPlans />} />
        <Route path="test-runs" element={<TestRuns />} />
        <Route path="test-traceability" element={<TestTraceability />} />
        <Route path="test-defects" element={<TestDefects />} />
        <Route path="test-defects/raise" element={<RaiseDefect />} />
        <Route path="test-reports" element={<TestReports />} />
        <Route path="activity" element={<ActivityLog />} />
        <Route path="chat" element={<Chat />} />
        <Route path="ai-monitoring" element={<AiMonitoring />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        <Route path="profile" element={<Profile />} />
        <Route path="coming-soon" element={<ComingSoon />} />
        <Route
          path="team"
          element={
            <RoleProtectedRoute minRole="Admin">
              <TeamManagement />
            </RoleProtectedRoute>
          }
        />
      </Route>
      <Route
        path="/task/:id"
        element={
          <ProtectedRoute>
            <TaskDetails />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <div className="min-h-screen bg-gray-50">
            <AppRoutes />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
