import { AuditLog, Project, Task, User } from "../models";
import { fn, literal, Op } from "sequelize";
import {
  ACTIVE_TASK_STATUSES,
  DONE_TASK_STATUSES,
  TODO_TASK_STATUSES,
} from "../utils/taskStatus";

const getUserOrganizationId = async (userId: string) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.organization_id || null;
};

const getTaskScope = (userId: string) => ({
  [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
});

const getScopedProjectInclude = (organizationId: string) => [
  {
    model: Project,
    as: "project",
    attributes: ["id", "name", "status"],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
  },
] as const;

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

  const taskScope = getTaskScope(userId);
  const scopedProjectInclude = getScopedProjectInclude(organizationId);
  const today = startOfDay(new Date());

  const [
    totalTasks,
    completedTasks,
    inProgressTasks,
    todoTasks,
    overdueTasks,
  ] = await Promise.all([
    Task.count({
      where: taskScope,
      include: scopedProjectInclude as any,
      distinct: true,
      col: "id",
    }),
    Task.count({
      where: { ...taskScope, status: { [Op.in]: DONE_TASK_STATUSES } },
      include: scopedProjectInclude as any,
      distinct: true,
      col: "id",
    }),
    Task.count({
      where: { ...taskScope, status: { [Op.in]: ACTIVE_TASK_STATUSES } },
      include: scopedProjectInclude as any,
      distinct: true,
      col: "id",
    }),
    Task.count({
      where: { ...taskScope, status: { [Op.in]: TODO_TASK_STATUSES } },
      include: scopedProjectInclude as any,
      distinct: true,
      col: "id",
    }),
    Task.count({
      where: {
        ...taskScope,
        status: { [Op.notIn]: DONE_TASK_STATUSES },
        due_date: {
          [Op.not]: null,
          [Op.lt]: today,
        },
      },
      include: scopedProjectInclude as any,
      distinct: true,
      col: "id",
    }),
  ]);

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

  const taskScope = getTaskScope(userId);
  const scopedProjectInclude = getScopedProjectInclude(organizationId);

  const upcomingTasksRaw = await Task.findAll({
    where: {
      ...taskScope,
      status: {
        [Op.notIn]: DONE_TASK_STATUSES,
      },
      due_date: {
        [Op.not]: null,
      },
    },
    include: [
      ...(scopedProjectInclude as any),
      {
        model: User,
        as: "assignee",
        attributes: ["id", "first_name", "last_name", "email"],
        required: false,
      },
    ],
    order: [["due_date", "ASC"]],
    limit: upcomingLimit,
  });

  const [relevantTaskIdsRaw, relevantProjectIdsRaw] = await Promise.all([
    Task.findAll({
      where: taskScope,
      include: [...(scopedProjectInclude as any)],
      attributes: ["id"],
      raw: true,
    }),
    Task.findAll({
      where: taskScope,
      include: [...(scopedProjectInclude as any)],
      attributes: ["project_id"],
      group: ["Task.project_id", "project.id", "project->owner.id"],
      raw: true,
    }),
  ]);

  const taskIds = relevantTaskIdsRaw.map((task: any) => String(task.id));
  const projectIds = relevantProjectIdsRaw
    .map((task: any) => task.project_id)
    .filter((projectId: string | null | undefined): projectId is string => Boolean(projectId));

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
        attributes: ["id", "first_name", "last_name", "email"],
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

  const taskScope = getTaskScope(userId);
  const scopedProjectInclude = getScopedProjectInclude(organizationId);
  const today = startOfDay(new Date());
  const inAWeek = new Date(today);
  inAWeek.setDate(today.getDate() + 7);

  const [
    statusRows,
    priorityRows,
    dueDateCounts,
    taskProjectRows,
    ownedProjects,
  ] = await Promise.all([
    Task.findAll({
      where: taskScope,
      include: scopedProjectInclude as any,
      attributes: ["status", [fn("COUNT", literal("*")), "count"]],
      group: ["Task.status", "project.id", "project->owner.id"],
      raw: true,
    }),
    Task.findAll({
      where: taskScope,
      include: scopedProjectInclude as any,
      attributes: ["priority", [fn("COUNT", literal("*")), "count"]],
      group: ["Task.priority", "project.id", "project->owner.id"],
      raw: true,
    }),
    Promise.all([
      Task.count({
        where: {
          ...taskScope,
          due_date: null,
        },
        include: scopedProjectInclude as any,
        distinct: true,
        col: "id",
      }),
      Task.count({
        where: {
          ...taskScope,
          due_date: { [Op.lt]: today },
        },
        include: scopedProjectInclude as any,
        distinct: true,
        col: "id",
      }),
      Task.count({
        where: {
          ...taskScope,
          due_date: today,
        },
        include: scopedProjectInclude as any,
        distinct: true,
        col: "id",
      }),
      Task.count({
        where: {
          ...taskScope,
          due_date: {
            [Op.gt]: today,
            [Op.lte]: inAWeek,
          },
        },
        include: scopedProjectInclude as any,
        distinct: true,
        col: "id",
      }),
      Task.count({
        where: {
          ...taskScope,
          due_date: {
            [Op.gt]: inAWeek,
          },
        },
        include: scopedProjectInclude as any,
        distinct: true,
        col: "id",
      }),
    ]),
    Task.findAll({
      where: taskScope,
      include: scopedProjectInclude as any,
      attributes: [
        "project_id",
        [fn("COUNT", literal("*")), "total"],
        [
          fn(
            "SUM",
            literal(`CASE WHEN "Task"."status" IN ('Done') THEN 1 ELSE 0 END`),
          ),
          "completed",
        ],
      ],
      group: ["Task.project_id", "project.id", "project->owner.id"],
      raw: true,
    }),
    Project.findAll({
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
    }),
  ]);

  const statusBreakdown = {
    todo: 0,
    in_progress: 0,
    done: 0,
  };

  statusRows.forEach((row: any) => {
    const count = Number(row.count || 0);
    if (TODO_TASK_STATUSES.includes(row.status)) statusBreakdown.todo += count;
    if (ACTIVE_TASK_STATUSES.includes(row.status)) statusBreakdown.in_progress += count;
    if (DONE_TASK_STATUSES.includes(row.status)) statusBreakdown.done += count;
  });

  const priorityBreakdown = {
    high: 0,
    medium: 0,
    low: 0,
  };

  priorityRows.forEach((row: any) => {
    const count = Number(row.count || 0);
    if (row.priority === "High") priorityBreakdown.high += count;
    if (row.priority === "Medium") priorityBreakdown.medium += count;
    if (row.priority === "Low") priorityBreakdown.low += count;
  });

  const dueDateBreakdown = {
    overdue: dueDateCounts[1],
    today: dueDateCounts[2],
    this_week: dueDateCounts[3],
    later: dueDateCounts[4],
    no_due_date: dueDateCounts[0],
  };

  const taskProjectIds = Array.from(
    new Set(
      taskProjectRows
        .map((row: any) => row.project_id)
        .filter((projectId: string | null | undefined): projectId is string => Boolean(projectId)),
    ),
  );

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

  const tasksByProject = taskProjectRows.reduce(
    (acc, row: any) => {
      if (!row.project_id) return acc;
      acc[String(row.project_id)] = {
        total: Number(row.total || 0),
        completed: Number(row.completed || 0),
      };
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
