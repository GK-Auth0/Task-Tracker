import { Op } from "sequelize";
import { Project, ProjectMember, Task, UserPinnedItem, UserSavedView } from "../models";

export type PinEntityType = "task" | "project";
export type SavedViewPage = "tasks" | "projects";

const isValidEntityType = (value: string): value is PinEntityType =>
  value === "task" || value === "project";

const isValidPage = (value: string): value is SavedViewPage =>
  value === "tasks" || value === "projects";

const ensureTaskAccess = async (userId: string, taskId: string) => {
  const task = await Task.findOne({
    where: {
      id: taskId,
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
    attributes: ["id"],
  });
  if (!task) {
    throw new Error("Task not found or access denied");
  }
};

const ensureProjectAccess = async (userId: string, projectId: string) => {
  const project = await Project.findOne({
    where: {
      id: projectId,
      [Op.or]: [{ owner_id: userId }],
    },
    attributes: ["id"],
  });

  if (project) {
    return;
  }

  const member = await ProjectMember.findOne({
    where: { project_id: projectId, user_id: userId },
    attributes: ["project_id"],
  });

  if (!member) {
    throw new Error("Project not found or access denied");
  }
};

export const listPins = async (userId: string, entityType?: string) => {
  const where: { user_id: string; entity_type?: PinEntityType } = { user_id: userId };
  if (entityType && isValidEntityType(entityType)) {
    where.entity_type = entityType;
  }

  const rows = await UserPinnedItem.findAll({
    where,
    order: [["created_at", "DESC"]],
  });
  return rows.map((row) => row.get({ plain: true }));
};

export const createPin = async (
  userId: string,
  entityType: string,
  entityId: string,
  note?: string,
) => {
  if (!isValidEntityType(entityType)) {
    throw new Error("Invalid entity type");
  }

  if (entityType === "task") {
    await ensureTaskAccess(userId, entityId);
  } else {
    await ensureProjectAccess(userId, entityId);
  }

  const [row] = await UserPinnedItem.findOrCreate({
    where: { user_id: userId, entity_type: entityType, entity_id: entityId },
    defaults: {
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      note,
    },
  });

  if (note !== undefined) {
    await row.update({ note });
  }

  return row.get({ plain: true });
};

export const deletePin = async (
  userId: string,
  entityType: string,
  entityId: string,
) => {
  if (!isValidEntityType(entityType)) {
    throw new Error("Invalid entity type");
  }

  await UserPinnedItem.destroy({
    where: {
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
    },
  });
};

export const listSavedViews = async (userId: string, page?: string) => {
  const where: { user_id: string; page?: SavedViewPage } = { user_id: userId };
  if (page && isValidPage(page)) {
    where.page = page;
  }

  const rows = await UserSavedView.findAll({
    where,
    order: [
      ["is_default", "DESC"],
      ["created_at", "DESC"],
    ],
  });
  return rows.map((row) => row.get({ plain: true }));
};

export const createSavedView = async (
  userId: string,
  page: string,
  name: string,
  filters: Record<string, unknown>,
  isDefault: boolean,
) => {
  if (!isValidPage(page)) {
    throw new Error("Invalid page");
  }

  if (isDefault) {
    await UserSavedView.update(
      { is_default: false },
      {
        where: {
          user_id: userId,
          page,
          is_default: true,
        },
      },
    );
  }

  const row = await UserSavedView.create({
    user_id: userId,
    page,
    name,
    filters,
    is_default: isDefault,
  });

  return row.get({ plain: true });
};

export const updateSavedView = async (
  userId: string,
  id: string,
  payload: {
    name?: string;
    filters?: Record<string, unknown>;
    is_default?: boolean;
  },
) => {
  const row = await UserSavedView.findOne({ where: { id, user_id: userId } });
  if (!row) {
    throw new Error("Saved view not found");
  }

  if (payload.is_default) {
    await UserSavedView.update(
      { is_default: false },
      {
        where: {
          user_id: userId,
          page: row.page,
          id: { [Op.ne]: id },
        },
      },
    );
  }

  await row.update({
    ...(payload.name !== undefined ? { name: payload.name } : {}),
    ...(payload.filters !== undefined ? { filters: payload.filters } : {}),
    ...(payload.is_default !== undefined ? { is_default: payload.is_default } : {}),
  });
  return row.get({ plain: true });
};

export const deleteSavedView = async (userId: string, id: string) => {
  await UserSavedView.destroy({
    where: {
      id,
      user_id: userId,
    },
  });
};
