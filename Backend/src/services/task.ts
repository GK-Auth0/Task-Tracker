import { Task, Project, User, Subtask, Comment } from "../models";
import { Op } from "sequelize";

interface TaskFilters {
  status?: string;
  priority?: string;
  project_id?: string;
}

interface CreateTaskDto {
  title: string;
  description?: string;
  status: string;
  priority: string;
  project_id: string;
  assignee_id?: string;
  creator_id: string;
  due_date?: string;
}

interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignee_id?: string;
  due_date?: string;
}

export async function getAllTasks(
  userId: string,
  filters: TaskFilters,
  page: number = 1,
  limit: number = 5,
) {
  const whereClause: any = {};

  if (filters.status) {
    whereClause.status = filters.status;
  }

  if (filters.priority) {
    whereClause.priority = filters.priority;
  }

  if (filters.project_id) {
    // If filtering by project, show all tasks in that project
    // (assuming user has access to the project)
    whereClause.project_id = filters.project_id;
  } else {
    // If not filtering by project, only show user's tasks
    whereClause[Op.or] = [{ creator_id: userId }, { assignee_id: userId }];
  }

  const offset = (page - 1) * limit;

  const { count, rows } = await Task.findAndCountAll({
    where: whereClause,
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
  const task = await Task.create({
    title: dto.title,
    description: dto.description,
    status: dto.status,
    priority: dto.priority,
    project_id: dto.project_id,
    assignee_id: dto.assignee_id,
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
    ],
  });

  return taskWithRelations?.get({ plain: true });
}

export async function getTaskById(taskId: string, userId: string) {
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
        model: Subtask,
        as: "subtasks",
        attributes: ["id", "title", "is_completed"],
      },
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
  const task = await Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  const updateData: any = {};
  if (dto.title !== undefined) updateData.title = dto.title;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.priority !== undefined) updateData.priority = dto.priority;
  if (dto.assignee_id !== undefined) updateData.assignee_id = dto.assignee_id;
  if (dto.due_date !== undefined)
    updateData.due_date = dto.due_date ? new Date(dto.due_date) : null;

  await task.update(updateData);

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
    ],
  });

  return updatedTask?.get({ plain: true });
}

export async function deleteTask(taskId: string, userId: string) {
  const task = await Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
  });

  if (!task) {
    throw new Error("Task not found or access denied");
  }

  await task.destroy();
}
