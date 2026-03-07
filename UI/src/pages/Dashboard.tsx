import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  dashboardAPI,
  tasksAPI,
  type DashboardInsights,
  type DashboardOverview,
  type DashboardOverviewActivity,
  type DashboardOverviewUpcomingTask,
} from "../services/dashboard";
import { projectService } from "../services/projectService";
import {
  aiAssistantAPI,
  type AiAutoInsightProject,
  type AiAutoInsightTask,
  type AiAutoInsights,
  type AiChatContextResult,
  type AiWorkloadForecast,
} from "../services/aiAssistant";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardStatsGrid from "../components/dashboard/DashboardStatsGrid";
import DashboardInsightsPanel from "../components/dashboard/DashboardInsightsPanel";
import DashboardUpcomingTasks from "../components/dashboard/DashboardUpcomingTasks";
import DashboardRecentActivity from "../components/dashboard/DashboardRecentActivity";
import DashboardProjectsPanel, {
  DashboardProjectDetail,
} from "../components/dashboard/DashboardProjectsPanel";
import DashboardAiPanel from "../components/dashboard/DashboardAiPanel";

const formatDueText = (daysToDue: number | null) => {
  if (daysToDue === null) return "No due date";
  if (daysToDue < 0) return `Overdue by ${Math.abs(daysToDue)}d`;
  if (daysToDue === 0) return "Due today";
  if (daysToDue === 1) return "Due tomorrow";
  return `Due in ${daysToDue}d`;
};

const formatActivityText = (activity: DashboardOverviewActivity) => {
  const actor = activity.user?.full_name || "A user";
  const target = activity.entity_type;

  switch (activity.action) {
    case "created":
      return `${actor} created a ${target}`;
    case "updated":
      return `${actor} updated a ${target}`;
    case "deleted":
      return `${actor} deleted a ${target}`;
    case "status_changed":
      return `${actor} changed ${target} status`;
    case "assigned":
      return `${actor} assigned a ${target}`;
    case "unassigned":
      return `${actor} unassigned a ${target}`;
    default:
      return `${actor} updated a ${target}`;
  }
};

const priorityBadgeClass = (priority: DashboardOverviewUpcomingTask["priority"]) => {
  if (priority === "High") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  if (priority === "Medium") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  return "bg-sky-100 text-sky-700 border-sky-200";
};

const statusBadgeClass = (status: DashboardOverviewUpcomingTask["status"]) => {
  if (status === "Done") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "In Progress") {
    return "bg-blue-100 text-blue-700 border-blue-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
};

const parseProjects = (payload: unknown): DashboardProjectDetail[] => {
  if (Array.isArray((payload as { data?: unknown })?.data)) {
    return ((payload as { data: unknown[] }).data || []).map((project: any) => ({
      id: String(project?.id || ""),
      name: String(project?.name || "Untitled Project"),
      description: project?.description ? String(project.description) : undefined,
      status: String(project?.status || "planning").toLowerCase(),
      priority: String(project?.priority || "medium").toLowerCase(),
    }));
  }

  const nested = (payload as { data?: { data?: unknown } })?.data?.data;
  if (Array.isArray(nested)) {
    return nested.map((project: any) => ({
      id: String(project?.id || ""),
      name: String(project?.name || "Untitled Project"),
      description: project?.description ? String(project.description) : undefined,
      status: String(project?.status || "planning").toLowerCase(),
      priority: String(project?.priority || "medium").toLowerCase(),
    }));
  }

  return [];
};

const mapTaskForAi = (task: {
  title: string;
  priority: "Low" | "Medium" | "High";
  due_date?: string;
  status: string;
}): AiAutoInsightTask => ({
  title: task.title,
  priority: task.priority,
  due_date: task.due_date,
  status: task.status,
  estimated_hours:
    task.priority === "High" ? 3 : task.priority === "Medium" ? 2 : 1.25,
});

const mapProjectForAi = (project: DashboardProjectDetail): AiAutoInsightProject => ({
  id: project.id,
  name: project.name,
  status: project.status,
  priority: project.priority,
});

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [insights, setInsights] = useState<DashboardInsights | null>(null);
  const [projects, setProjects] = useState<DashboardProjectDetail[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiAutoInsights, setAiAutoInsights] = useState<AiAutoInsights | null>(null);
  const [aiForecast, setAiForecast] = useState<AiWorkloadForecast | null>(null);
  const [aiActionReply, setAiActionReply] = useState<AiChatContextResult | null>(null);
  const [aiActionLoading, setAiActionLoading] = useState(false);
  const [aiTasksContext, setAiTasksContext] = useState<AiAutoInsightTask[]>([]);
  const [aiProjectsContext, setAiProjectsContext] = useState<AiAutoInsightProject[]>([]);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const [overviewRes, insightsRes, projectRes, tasksRes] = await Promise.all([
        dashboardAPI.getOverview({
          upcomingLimit: 12,
          activityLimit: 8,
        }),
        dashboardAPI.getInsights(),
        projectService.getProjects(),
        tasksAPI.getTasks({ page: 1, limit: 80 }),
      ]);
      setOverview(overviewRes.data);
      setInsights(insightsRes.data);
      const parsedProjects = parseProjects(projectRes);
      setProjects(parsedProjects);

      const aiTasks = (tasksRes.data || []).map(mapTaskForAi);
      const aiProjects = parsedProjects.map(mapProjectForAi);
      setAiTasksContext(aiTasks);
      setAiProjectsContext(aiProjects);
      setAiActionReply(null);

      if (aiTasks.length > 0) {
        setAiLoading(true);
        setAiError("");
        try {
          const [autoRes, forecastRes, defaultReply] = await Promise.all([
            aiAssistantAPI.autoInsights(aiTasks, aiProjects, "/dashboard"),
            aiAssistantAPI.workloadForecast(aiTasks, 7),
            aiAssistantAPI.chatContext(
              "Show top risks in my current page",
              aiTasks,
              aiProjects,
              "/dashboard",
              "balanced",
            ),
          ]);
          setAiAutoInsights(autoRes);
          setAiForecast(forecastRes);
          setAiActionReply(defaultReply);
        } catch (error) {
          setAiAutoInsights(null);
          setAiForecast(null);
          setAiActionReply(null);
          setAiError("AI insights unavailable right now.");
        } finally {
          setAiLoading(false);
        }
      } else {
        setAiAutoInsights(null);
        setAiForecast(null);
        setAiError("No tasks available for AI dashboard analysis.");
      }
    } catch (error) {
      console.error("Failed to fetch dashboard overview:", error);
    } finally {
      setLoading(false);
    }
  };

  const runAiAction = async (prompt: string) => {
    if (!aiTasksContext.length) return;
    try {
      setAiActionLoading(true);
      const response = await aiAssistantAPI.chatContext(
        prompt,
        aiTasksContext,
        aiProjectsContext,
        "/dashboard",
        "balanced",
      );
      setAiActionReply(response);
    } catch (error) {
      setAiActionReply({
        reply: "AI assistant is unavailable at the moment. Please retry shortly.",
        context_snapshot: "",
        quick_actions: [],
      });
    } finally {
      setAiActionLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="min-h-full p-4 sm:p-6 lg:p-8 space-y-6">
        <DashboardHeader
          overview={overview}
          onOpenTasks={() => navigate("/tasks")}
          onRefresh={fetchOverview}
        />

        <DashboardStatsGrid overview={overview} />

        <DashboardInsightsPanel
          insights={insights}
          onOpenProjects={() => navigate("/projects")}
        />

        <DashboardAiPanel
          loading={aiLoading}
          error={aiError}
          autoInsights={aiAutoInsights}
          workload={aiForecast}
          actionReply={aiActionReply}
          actionLoading={aiActionLoading}
          onRunAction={runAiAction}
        />

        <DashboardProjectsPanel
          projects={projects.slice(0, 6)}
          projectHealthById={
            new Map((insights?.project_health || []).map((item) => [item.id, item]))
          }
          onOpenProject={(projectId) => navigate(`/projects/${projectId}`)}
          onOpenProjects={() => navigate("/projects")}
        />

        <DashboardUpcomingTasks
          tasks={overview?.upcoming_tasks || []}
          onOpenTask={(taskId) => navigate(`/task/${taskId}`)}
          onOpenTasksBoard={() => navigate("/tasks")}
          formatDueText={formatDueText}
          getPriorityClass={priorityBadgeClass}
          getStatusClass={statusBadgeClass}
        />

        <DashboardRecentActivity
          activity={overview?.recent_activity || []}
          onOpenActivity={() => navigate("/activity")}
          formatActivityText={formatActivityText}
        />
      </div>
    </div>
  );
}
