import { Task, Project, ProjectMember, User, Subtask, Comment, PullRequest, Commit, Defect, Sprint, TaskFile } from "../models";
import { Op } from "sequelize";
import type {
  CreateSubtaskDto,
  CreateTaskDto,
  TaskFilters,
  UpdateSubtaskDto,
  UpdateTaskDto,
} from "../types/task";

const getUserOrganizationId = async (userId: string) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.organization_id || null;
};

const getProjectInOrganization = async (projectId: string, organizationId: string) =>
  Project.findOne({
    where: { id: projectId },
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
    attributes: ["id", "owner_id"],
  });

const getAccessibleTask = async (taskId: string, userId: string, organizationId: string) =>
  Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
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
    ],
  });

const subtaskInclude = {
  model: Subtask,
  as: "subtasks",
  attributes: [
    "id",
    "title",
    "is_completed",
    "position",
    "assignee_id",
    "linked_task_id",
  ],
  include: [
    {
      model: User,
      as: "assignee",
      attributes: ["id", "full_name", "email"],
    },
    {
      model: Task,
      as: "linked_task",
      attributes: ["id", "status", "assignee_id"],
    },
  ],
};

const syncLinkedTaskToSubtask = async (linkedTaskId: string) => {
  const linkedTask = await Task.findByPk(linkedTaskId, {
    attributes: ["id", "title", "status", "assignee_id"],
  });

  if (!linkedTask) return;

  const subtask = await Subtask.findOne({
    where: { linked_task_id: linkedTaskId },
  });

  if (!subtask) return;

  await subtask.update({
    title: linkedTask.title,
    is_completed: linkedTask.status === "Done",
    assignee_id: linkedTask.assignee_id || null,
  });
};

export async function getAllTasks(
  userId: string,
  filters: TaskFilters,
  page: number = 1,
  limit: number = 5,
) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    return { tasks: [], total: 0 };
  }

  const whereClause: any = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.priority) {
    whereClause.priority = filters.priority;
  }

  if (filters.project_id) {
    const [ownedProject, membership] = await Promise.all([
      Project.findOne({
        where: {
          id: filters.project_id,
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
        attributes: ["id"],
      }),
      ProjectMember.findOne({
        where: {
          project_id: filters.project_id,
          user_id: userId,
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
        attributes: ["id"],
      }),
    ]);

    if (!ownedProject && !membership) {
      throw new Error("Access denied to this project");
    }

    whereClause.project_id = filters.project_id;
  } else {
    // If not filtering by project, only show user's tasks
    whereClause[Op.or] = [{ creator_id: userId }, { assignee_id: userId }];
  }

  if (filters.due_from || filters.due_to) {
    whereClause.due_date = {
      ...(filters.due_from ? { [Op.gte]: filters.due_from } : {}),
      ...(filters.due_to ? { [Op.lte]: filters.due_to } : {}),
    };
  }

  if (filters.created_from || filters.created_to) {
    whereClause.created_at = {
      ...(filters.created_from ? { [Op.gte]: filters.created_from } : {}),
      ...(filters.created_to ? { [Op.lte]: filters.created_to } : {}),
    };
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Task.findAndCountAll({
    where: whereClause,
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
        as: "creator",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: Sprint,
        as: "sprint",
        attributes: ["id", "name"],
      },
    ],
    order: [["created_at", "DESC"]],
    limit,
    offset,
  });

  return {
    tasks: rows.map((task) => task.get({ plain: true })),
    total: count,
  };
}

export async function createTask(dto: CreateTaskDto) {
  const organizationId = await getUserOrganizationId(dto.creator_id);
  if (!organizationId) {
    throw new Error("User must belong to an organization before creating tasks");
  }

  const project = await getProjectInOrganization(dto.project_id, organizationId);
  if (!project) {
    throw new Error("Access denied to this project");
  }

  if (dto.assignee_id) {
    const assignee = await User.findOne({
      where: {
        id: dto.assignee_id,
        organization_id: organizationId,
      },
      attributes: ["id"],
    });

    if (!assignee) {
      throw new Error("Assignee must belong to the same organization");
    }
  }

  if (dto.defect_id) {
    const defect = await Defect.findOne({
      where: {
        id: dto.defect_id,
        project_id: dto.project_id,
      },
      attributes: ["id", "project_id"],
    });

    if (!defect) {
      throw new Error("Defect must belong to the selected project");
    }
  }

  if (dto.sprint_id) {
    const sprint = await Sprint.findOne({
      where: {
        id: dto.sprint_id,
        project_id: dto.project_id,
      },
      attributes: ["id"],
    });

    if (!sprint) {
      throw new Error("Sprint must belong to the selected project");
    }
  }

  const task = await Task.create({
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    issue_type: dto.issue_type || "Task",
    project_id: dto.project_id,
    assignee_id: dto.assignee_id,
    defect_id: dto.defect_id,
    sprint_id: dto.sprint_id,
    creator_id: dto.creator_id,
    due_date: dto.due_date ? new Date(dto.due_date) : null,
  });

  const taskWithRelations = await Task.findByPk(task.id, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: Sprint,
        as: "sprint",
        attributes: ["id", "name"],
      },
      {
        model: TaskFile,
        as: "attachments",
        attributes: [
          "id",
          "filename",
          "original_name",
          "file_url",
          "file_size",
          "mime_type",
          "uploaded_by",
          "created_at",
        ],
        include: [
          {
            model: User,
            as: "uploader",
            attributes: ["id", "full_name", "email"],
          },
        ],
      },
      subtaskInclude,
    ],
  });

  if (dto.defect_id) {
    await Defect.update(
      { linked_task_id: task.id, created_task_id: task.id },
      {
        where: { id: dto.defect_id },
      },
    );
  }

  return taskWithRelations?.get({ plain: true });
}

export async function getTaskById(taskId: string, userId: string) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
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
        as: "creator",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: Sprint,
        as: "sprint",
        attributes: ["id", "name"],
      },
      {
        model: TaskFile,
        as: "attachments",
        attributes: [
          "id",
          "filename",
          "original_name",
          "file_url",
          "file_size",
          "mime_type",
          "uploaded_by",
          "created_at",
        ],
        include: [
          {
            model: User,
            as: "uploader",
            attributes: ["id", "full_name", "email"],
          },
        ],
      },
      subtaskInclude,
      {
        model: Comment,
        as: "comments",
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "full_name"],
          },
        ],
        order: [["created_at", "ASC"]],
      },
    ],
    order: [[{ model: Subtask, as: "subtasks" }, "position", "ASC"]],
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  return task.get({ plain: true });
}

export async function updateTask(
  taskId: string,
  dto: UpdateTaskDto,
  userId: string,
) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await Task.findOne({
    where: {
      id: taskId,
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
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  const updateData: any = {};
  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.priority !== undefined) updateData.priority = dto.priority;
  if (dto.issue_type !== undefined) updateData.issue_type = dto.issue_type;
  if (dto.assignee_id !== undefined) updateData.assignee_id = dto.assignee_id;
  if (dto.defect_id !== undefined) updateData.defect_id = dto.defect_id;
  if (dto.sprint_id !== undefined) updateData.sprint_id = dto.sprint_id;
  if (dto.due_date !== undefined)
    updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;

  if (dto.assignee_id) {
    const assignee = await User.findOne({
      where: {
        id: dto.assignee_id,
        organization_id: organizationId,
      },
      attributes: ["id"],
    });

    if (!assignee) {
      throw new Error("Assignee must belong to the same organization");
    }
  }

  if (dto.defect_id) {
    const defect = await Defect.findOne({
      where: {
        id: dto.defect_id,
        project_id: task.project.id,
      },
      attributes: ["id"],
    });

    if (!defect) {
      throw new Error("Defect must belong to the selected project");
    }
  }

  if (dto.sprint_id) {
    const sprint = await Sprint.findOne({
      where: {
        id: dto.sprint_id,
        project_id: task.project.id,
      },
      attributes: ["id"],
    });

    if (!sprint) {
      throw new Error("Sprint must belong to the selected project");
    }
  }

  await task.update(updateData);

  if (dto.defect_id !== undefined) {
    if (dto.defect_id) {
      await Defect.update(
        { linked_task_id: taskId, created_task_id: taskId },
        { where: { id: dto.defect_id } },
      );
    } else if (task.defect_id) {
      await Defect.update(
        { linked_task_id: null, created_task_id: null },
        { where: { id: task.defect_id } },
      );
    }
  }

  const updatedTask = await Task.findByPk(taskId, {
    include: [
      {
        model: Project,
        as: "project",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "creator",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: Sprint,
        as: "sprint",
        attributes: ["id", "name"],
      },
      subtaskInclude,
    ],
    order: [[{ model: Subtask, as: "subtasks" }, "position", "ASC"]],
  });

  await syncLinkedTaskToSubtask(taskId);

  return updatedTask?.get({ plain: true });
}

export async function createSubtask(
  taskId: string,
  dto: CreateSubtaskDto,
  userId: string,
) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await getAccessibleTask(taskId, userId, organizationId);
  if (!task) {
    throw new Error("Task not found or access denied");
  }

  if (dto.assignee_id) {
    const assignee = await User.findOne({
      where: {
        id: dto.assignee_id,
        organization_id: organizationId,
      },
      attributes: ["id"],
    });

    if (!assignee) {
      throw new Error("Assignee must belong to the same organization");
    }
  }

  const position = await Subtask.count({ where: { task_id: taskId } });
  const linkedTask = await Task.create({
    project_id: task.project.id,
    title: dto.title,
    description: `Subtask for ${task.title}. Open this item for the full task workflow.`,
    status: "To Do",
    priority: "Medium",
    issue_type: "Task",
    creator_id: userId,
    assignee_id: dto.assignee_id || null,
    sprint_id: task.get("sprint_id") || null,
  });
  const subtask = await Subtask.create({
    task_id: taskId,
    title: dto.title,
    position,
    assignee_id: dto.assignee_id || null,
    linked_task_id: linkedTask.id,
  });

  const subtaskWithRelations = await Subtask.findByPk(subtask.id, {
    include: [
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: Task,
        as: "linked_task",
        attributes: ["id", "status", "assignee_id"],
      },
    ],
  });

  return subtaskWithRelations?.get({ plain: true });
}

export async function updateSubtask(
  taskId: string,
  subtaskId: string,
  dto: UpdateSubtaskDto,
  userId: string,
) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await getAccessibleTask(taskId, userId, organizationId);
  if (!task) {
    throw new Error("Task not found or access denied");
  }

  if (dto.assignee_id) {
    const assignee = await User.findOne({
      where: {
        id: dto.assignee_id,
        organization_id: organizationId,
      },
      attributes: ["id"],
    });

    if (!assignee) {
      throw new Error("Assignee must belong to the same organization");
    }
  }

  const subtask = await Subtask.findOne({
    where: {
      id: subtaskId,
      task_id: taskId,
    },
  });

  if (!subtask) {
    throw new Error("Subtask not found");
  }

  await subtask.update({
    ...(dto.title !== undefined ? { title: dto.title } : {}),
    ...(dto.is_completed !== undefined ? { is_completed: dto.is_completed } : {}),
    ...(dto.assignee_id !== undefined ? { assignee_id: dto.assignee_id || null } : {}),
  });

  if (subtask.linked_task_id) {
    await Task.update(
      {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.is_completed !== undefined
          ? { status: dto.is_completed ? "Done" : "To Do" }
          : {}),
        ...(dto.assignee_id !== undefined ? { assignee_id: dto.assignee_id || null } : {}),
      },
      {
        where: { id: subtask.linked_task_id },
      },
    );
  }

  const subtaskWithRelations = await Subtask.findByPk(subtask.id, {
    include: [
      {
        model: User,
        as: "assignee",
        attributes: ["id", "full_name", "email"],
      },
      {
        model: Task,
        as: "linked_task",
        attributes: ["id", "status", "assignee_id"],
      },
    ],
  });

  return subtaskWithRelations?.get({ plain: true });
}

export async function deleteSubtask(
  taskId: string,
  subtaskId: string,
  userId: string,
) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await getAccessibleTask(taskId, userId, organizationId);
  if (!task) {
    throw new Error("Task not found or access denied");
  }

  const subtask = await Subtask.findOne({
    where: {
      id: subtaskId,
      task_id: taskId,
    },
  });

  if (!subtask) {
    throw new Error("Subtask not found");
  }

  const linkedTaskId = subtask.linked_task_id;
  await subtask.destroy();
  if (linkedTaskId) {
    await Task.destroy({ where: { id: linkedTaskId } });
  }
}

export async function getTaskForUpload(taskId: string, userId: string) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await getAccessibleTask(taskId, userId, organizationId);
  if (!task) {
    throw new Error("Task not found or access denied");
  }

  return task;
}

export async function syncSubtaskForLinkedTask(taskId: string) {
  await syncLinkedTaskToSubtask(taskId);
}

export async function deleteTask(taskId: string, userId: string) {
  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    throw new Error("Task not found or access denied");
  }

  const task = await Task.findOne({
    where: {
      id: taskId,
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
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  const childSubtasks = await Subtask.findAll({
    where: { task_id: taskId },
    attributes: ["linked_task_id"],
  });
  const linkedChildTaskIds = childSubtasks
    .map((subtask) => subtask.linked_task_id)
    .filter((value): value is string => Boolean(value));

  const linkedSubtask = await Subtask.findOne({
    where: { linked_task_id: taskId },
  });

  if (linkedSubtask) {
    await linkedSubtask.destroy();
  }

  await task.destroy();

  if (linkedChildTaskIds.length > 0) {
    await Task.destroy({
      where: {
        id: linkedChildTaskIds,
      },
    });
  }
}

export async function getTaskPullRequests(taskId: string, userId: string) {
  // First verify user has access to the task
  const task = await Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  const pullRequests = await PullRequest.findAll({
    where: { task_id: taskId },
    order: [["created_at", "DESC"]],
  });

  return pullRequests.map((pr) => ({
    id: pr.id,
    title: pr.title,
    status: pr.status,
    repository: pr.repository,
    branch: pr.branch,
    number: pr.number,
    author: pr.author,
    github_url: pr.github_url,
    created_at: pr.created_at,
  }));
}

export async function getTaskCommits(taskId: string, userId: string) {
  // First verify user has access to the task
  const task = await Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  const commits = await Commit.findAll({
    where: { task_id: taskId },
    order: [["created_at", "DESC"]],
  });

  return commits.map((commit) => ({
    id: commit.id,
    hash: commit.hash,
    message: commit.message,
    author: {
      name: commit.author_name,
      avatar: commit.author_avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
    created_at: commit.created_at,
  }));
}
