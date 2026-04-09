import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { hasMinimumWorkspaceRole, type WorkspaceRole } from "./types/roles";

// ✅ These are small/shared components — keep them as normal imports
import Layout from "./components/Layout";
import RingLoader from "./components/RingLoader";
import TaskDetails from "./components/TaskDetails";
import ComingSoon from "./components/ComingSoon";
import TeamManagement from "./components/TeamManagement";

// ✅ Lazy load all pages — they load ONLY when user navigates to them
const Dashboard           = lazy(() => import("./pages/Dashboard"));
const Tasks               = lazy(() => import("./pages/Tasks"));
const Projects            = lazy(() => import("./pages/Projects"));
const ProjectDetail       = lazy(() => import("./pages/ProjectDetail"));
const Profile             = lazy(() => import("./pages/Profile"));
const Calendar            = lazy(() => import("./pages/Calendar"));
const TestCases           = lazy(() => import("./pages/TestCases"));
const CreateTestCase      = lazy(() => import("./pages/CreateTestCase"));
const TestCaseModuleDetail = lazy(() => import("./pages/TestCaseModuleDetail"));
const TestCaseDetailPage  = lazy(() => import("./pages/TestCaseDetailPage"));
const SprintBoards        = lazy(() => import("./pages/SprintBoards"));
const TestPlans           = lazy(() => import("./pages/TestPlans"));
const TestRuns            = lazy(() => import("./pages/TestRuns"));
const TestReports         = lazy(() => import("./pages/TestReports"));
const TestTraceability    = lazy(() => import("./pages/TestTraceability"));
const TestDefects         = lazy(() => import("./pages/TestDefects"));
const DefectReports       = lazy(() => import("./pages/DefectReports"));
const DefectDetailPage    = lazy(() => import("./pages/DefectDetailPage"));
const RaiseDefect         = lazy(() => import("./pages/RaiseDefect"));
const Analytics           = lazy(() => import("./pages/Analytics"));
const ActivityLog         = lazy(() => import("./pages/ActivityLog"));
const Chat                = lazy(() => import("./pages/Chat"));
const AiMonitoring        = lazy(() => import("./pages/AiMonitoring"));
const Settings            = lazy(() => import("./pages/Settings"));
const Help                = lazy(() => import("./pages/Help"));

// Auth pages — lazy loaded too
const Login               = lazy(() => import("./pages/Login"));
const Register            = lazy(() => import("./pages/Register"));
const AuthCallback        = lazy(() => import("./pages/AuthCallback"));
const ForgotPassword      = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword       = lazy(() => import("./pages/ResetPassword"));
const ChangePassword      = lazy(() => import("./pages/ChangePassword"));
const NotFound            = lazy(() => import("./pages/NotFound"));
const OrganizationOnboarding = lazy(() => import("./pages/OrganizationOnboarding"));

const queryClient = new QueryClient();

// ✅ Reusable loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <RingLoader size="lg" />
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" />;
  if (!user.organization) return <Navigate to="/organization/onboarding" replace />;

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <>{children}</>;

  return <Navigate to={user.organization ? "/dashboard" : "/organization/onboarding"} replace />;
}

function OrganizationOnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.organization) return <Navigate to="/dashboard" replace />;

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

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!hasMinimumWorkspaceRole(user.role, minRole)) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
}

function AppRoutes() {
  return (
    // ✅ Suspense wraps ALL routes — shows loader while any lazy page loads
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public Routes */}
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
        <Route path="/change-password" element={<PublicRoute><ChangePassword /></PublicRoute>} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Onboarding Route */}
        <Route
          path="/organization/onboarding"
          element={
            <OrganizationOnboardingRoute>
              <OrganizationOnboarding />
            </OrganizationOnboardingRoute>
          }
        />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard"                   element={<Dashboard />} />
          <Route path="tasks"                        element={<Tasks />} />
          <Route path="task/:id"                     element={<TaskDetails />} />
          <Route path="projects"                     element={<Projects />} />
          <Route path="projects/:id"                 element={<ProjectDetail />} />
          <Route path="calendar"                     element={<Calendar />} />
          <Route path="analytics"                    element={<Analytics />} />
          <Route path="sprint-board"                 element={<SprintBoards />} />
          <Route path="test-cases"                   element={<TestCases />} />
          <Route path="test-cases/create"            element={<CreateTestCase />} />
          <Route path="test-cases/modules/:moduleSlug" element={<TestCaseModuleDetail />} />
          <Route path="test-cases/case/:id"          element={<TestCaseDetailPage />} />
          <Route path="sprint-dev-board"             element={<Navigate to="/sprint-board" replace />} />
          <Route path="sprint-qa-board"              element={<Navigate to="/sprint-board" replace />} />
          <Route path="test-plans"                   element={<TestPlans />} />
          <Route path="test-runs"                    element={<TestRuns />} />
          <Route path="test-traceability"            element={<TestTraceability />} />
          <Route path="test-defects"                 element={<TestDefects />} />
          <Route path="test-defects/reports"         element={<DefectReports />} />
          <Route path="test-defects/:id"             element={<DefectDetailPage />} />
          <Route path="test-defects/raise"           element={<RaiseDefect />} />
          <Route path="test-reports"                 element={<TestReports />} />
          <Route path="activity"                     element={<ActivityLog />} />
          <Route path="chat"                         element={<Chat />} />
          <Route path="ai-monitoring"                element={<AiMonitoring />} />
          <Route path="settings"                     element={<Settings />} />
          <Route path="help"                         element={<Help />} />
          <Route path="profile"                      element={<Profile />} />
          <Route path="coming-soon"                  element={<ComingSoon />} />
          <Route
            path="team"
            element={
              <RoleProtectedRoute minRole="Admin">
                <TeamManagement />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
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
