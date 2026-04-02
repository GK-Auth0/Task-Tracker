import { AuditLog, Project, Task, User } from "../models";
import { Op } from "sequelize";

const getUserOrganizationId = async (userId: string) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.organization_id || null;
};

export async function getDashboardSummary(userId: string) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    return {
      total_tasks: 0,
      completed_tasks: 0,
      in_progress_tasks: 0,
      todo_tasks: 0,
      overdue_tasks: 0,
      completion_rate: 0,
    };
  }

  const now = new Date();

  // Get all tasks for the user (created or assigned)
  const allTasks = await Task.findAll({
    where: {
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "organization_id"],
            where: { organization_id: organizationId },
          },
        ],
      },
    ],
    attributes: ["status", "due_date"],
  });

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter(
    (task) => task.status === "Done",
  ).length;
  const inProgressTasks = allTasks.filter(
    (task) => task.status === "In Progress",
  ).length;
  const todoTasks = allTasks.filter((task) => task.status === "To Do").length;

  // Calculate overdue tasks (due date passed and not completed)
  const overdueTasks = allTasks.filter(
    (task) =>
      task.due_date && new Date(task.due_date) < now && task.status !== "Done",
  ).length;

  return {
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    in_progress_tasks: inProgressTasks,
    todo_tasks: todoTasks,
    overdue_tasks: overdueTasks,
    completion_rate:
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

type DashboardOverviewOptions = {
  upcomingLimit?: number;
  activityLimit?: number;
};

type DashboardInsightsProjectHealth = {
  id: string;
  name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  open_tasks: number;
  completion_rate: number;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const formatDaysToDue = (dueDate: Date) => {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(dueDate));
  return Math.floor((due.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

export async function getDashboardOverview(
  userId: string,
  options: DashboardOverviewOptions = {},
) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    return {
      summary: await getDashboardSummary(userId),
      metrics: {
        open_tasks: 0,
        high_priority_upcoming: 0,
        due_today: 0,
        due_this_week: 0,
      },
      upcoming_tasks: [],
      recent_activity: [],
    };
  }

  const upcomingLimit = Math.min(Math.max(options.upcomingLimit || 12, 1), 50);
  const activityLimit = Math.min(Math.max(options.activityLimit || 10, 1), 50);

  const summary = await getDashboardSummary(userId);

  const taskScope = {
    [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
  };

  const upcomingTasksRaw = await Task.findAll({
    where: {
      ...taskScope,
      status: {
        [Op.ne]: "Done",
      },
      due_date: {
        [Op.not]: null,
      },
    },
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "organization_id"],
            where: { organization_id: organizationId },
          },
        ],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
        required: false,
      },
    ],
    order: [["due_date", "ASC"]],
    limit: upcomingLimit,
  });

  const relevantTasks = await Task.findAll({
    where: taskScope,
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "organization_id"],
            where: { organization_id: organizationId },
          },
        ],
      },
    ],
    attributes: ["id", "project_id"],
  });

  const taskIds = relevantTasks.map((task) => task.id);
  const projectIds = Array.from(
    new Set(
      relevantTasks
        .map((task) => task.project_id)
        .filter((projectId): projectId is string => Boolean(projectId)),
    ),
  );

  const activityWhere: any = {};
  if (taskIds.length > 0 || projectIds.length > 0) {
    activityWhere[Op.or] = [
      ...(taskIds.length > 0
        ? [
            {
              entity_type: "task",
              entity_id: {
                [Op.in]: taskIds,
              },
            },
          ]
        : []),
      ...(projectIds.length > 0
        ? [
            {
              entity_type: "project",
              entity_id: {
                [Op.in]: projectIds,
              },
            },
          ]
        : []),
    ];
  } else {
    activityWhere.user_id = userId;
  }

  const recentActivityRaw = await AuditLog.findAll({
    where: activityWhere,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "full_name", "email"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: activityLimit,
  });

  const upcomingTasks = upcomingTasksRaw.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    due_date: task.due_date,
    days_to_due: task.due_date ? formatDaysToDue(new Date(task.due_date)) : null,
    project: task.project
      ? {
          id: task.project.id,
          name: task.project.name,
        }
      : null,
    assignee: task.assignee
      ? {
          id: task.assignee.id,
          full_name: task.assignee.full_name,
          email: task.assignee.email,
        }
      : null,
  }));

  const recentActivity = recentActivityRaw.map((log) => ({
    id: log.id,
    entity_type: log.entity_type,
    entity_id: log.entity_id,
    action: log.action,
    created_at: log.created_at,
    user: log.user
      ? {
          id: log.user.id,
          full_name: log.user.full_name,
          email: log.user.email,
        }
      : null,
  }));

  const openTaskCount = summary.total_tasks - summary.completed_tasks;
  const highPriorityUpcoming = upcomingTasks.filter(
    (task) => task.priority === "High",
  ).length;
  const dueTodayCount = upcomingTasks.filter((task) => task.days_to_due === 0).length;
  const dueThisWeekCount = upcomingTasks.filter(
    (task) => typeof task.days_to_due === "number" && task.days_to_due >= 0 && task.days_to_due <= 7,
  ).length;

  return {
    summary,
    metrics: {
      open_tasks: openTaskCount,
      high_priority_upcoming: highPriorityUpcoming,
      due_today: dueTodayCount,
      due_this_week: dueThisWeekCount,
    },
    upcoming_tasks: upcomingTasks,
    recent_activity: recentActivity,
  };
}

const normalizeProjectStatus = (status: string | null | undefined) => {
  if (!status) return "planning";
  const normalized = status.toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "on_hold") return "on_hold";
  if (normalized === "completed") return "completed";
  if (normalized === "cancelled") return "cancelled";
  return "planning";
};

export async function getDashboardInsights(userId: string) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    return {
      task_status_breakdown: { todo: 0, in_progress: 0, done: 0 },
      task_priority_breakdown: { high: 0, medium: 0, low: 0 },
      due_date_breakdown: {
        overdue: 0,
        today: 0,
        this_week: 0,
        later: 0,
        no_due_date: 0,
      },
      project_status_breakdown: {
        planning: 0,
        active: 0,
        on_hold: 0,
        completed: 0,
        cancelled: 0,
      },
      project_health: [],
    };
  }

  const taskScope = {
    [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
  };

  const tasks = await Task.findAll({
    where: taskScope,
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id"],
        include: [
          {
            model: User,
            as: "owner",
            attributes: ["id", "organization_id"],
            where: { organization_id: organizationId },
          },
        ],
      },
    ],
    attributes: ["id", "status", "priority", "due_date", "project_id"],
  });

  const statusBreakdown = {
    todo: tasks.filter((task) => task.status === "To Do").length,
    in_progress: tasks.filter((task) => task.status === "In Progress").length,
    done: tasks.filter((task) => task.status === "Done").length,
  };

  const priorityBreakdown = {
    high: tasks.filter((task) => task.priority === "High").length,
    medium: tasks.filter((task) => task.priority === "Medium").length,
    low: tasks.filter((task) => task.priority === "Low").length,
  };

  const today = startOfDay(new Date());
  const inAWeek = new Date(today);
  inAWeek.setDate(today.getDate() + 7);

  const dueDateBreakdown = {
    overdue: 0,
    today: 0,
    this_week: 0,
    later: 0,
    no_due_date: 0,
  };

  tasks.forEach((task) => {
    if (!task.due_date) {
      dueDateBreakdown.no_due_date += 1;
      return;
    }

    const dueDate = startOfDay(new Date(task.due_date));
    if (dueDate.getTime() < today.getTime()) {
      dueDateBreakdown.overdue += 1;
      return;
    }

    if (dueDate.getTime() === today.getTime()) {
      dueDateBreakdown.today += 1;
      return;
    }

    if (dueDate.getTime() <= inAWeek.getTime()) {
      dueDateBreakdown.this_week += 1;
      return;
    }

    dueDateBreakdown.later += 1;
  });

  const taskProjectIds = Array.from(
    new Set(tasks.map((task) => task.project_id).filter(Boolean)),
  ) as string[];

  const ownedProjects = await Project.findAll({
    where: {
      owner_id: userId,
    },
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
    attributes: ["id", "name", "status"],
  });

  const ownedProjectIds = ownedProjects.map((project) => project.id);
  const relevantProjectIds = Array.from(new Set([...taskProjectIds, ...ownedProjectIds]));

  const scopedProjects =
    relevantProjectIds.length > 0
      ? await Project.findAll({
          where: {
            id: {
              [Op.in]: relevantProjectIds,
            },
          },
          include: [
            {
              model: User,
              as: "owner",
              attributes: ["id", "organization_id"],
              where: { organization_id: organizationId },
            },
          ],
          attributes: ["id", "name", "status"],
        })
      : [];

  const tasksByProject = tasks.reduce(
    (acc, task) => {
      if (!task.project_id) return acc;
      if (!acc[task.project_id]) {
        acc[task.project_id] = {
          total: 0,
          completed: 0,
        };
      }
      acc[task.project_id].total += 1;
      if (task.status === "Done") {
        acc[task.project_id].completed += 1;
      }
      return acc;
    },
    {} as Record<string, { total: number; completed: number }>,
  );

  const statusCounts = {
    planning: 0,
    active: 0,
    on_hold: 0,
    completed: 0,
    cancelled: 0,
  };

  const projectHealth: DashboardInsightsProjectHealth[] = scopedProjects
    .map((project) => {
      const stats = tasksByProject[project.id] || { total: 0, completed: 0 };
      const normalizedStatus = normalizeProjectStatus(project.status);
      statusCounts[normalizedStatus] += 1;

      const completionRate =
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

      return {
        id: project.id,
        name: project.name,
        status: normalizedStatus,
        total_tasks: stats.total,
        completed_tasks: stats.completed,
        open_tasks: stats.total - stats.completed,
        completion_rate: completionRate,
      };
    })
    .sort((a, b) => b.open_tasks - a.open_tasks || a.name.localeCompare(b.name))
    .slice(0, 8);

  return {
    task_status_breakdown: statusBreakdown,
    task_priority_breakdown: priorityBreakdown,
    due_date_breakdown: dueDateBreakdown,
    project_status_breakdown: statusCounts,
    project_health: projectHealth,
  };
}
