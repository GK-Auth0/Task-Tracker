import { Op } from "sequelize";
import { Project, ProjectMember, Task, User } from "../models";

const getUserOrganizationId = async (userId: string) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user.organization_id || null;
};

export const searchWorkspace = async (
  userId: string,
  rawQuery: string,
  limit = 5,
) => {
  const query = String(rawQuery || "").trim();
  if (!query) {
    return { tasks: [], projects: [] };
  }

  const organizationId = await getUserOrganizationId(userId);
  if (!organizationId) {
    return { tasks: [], projects: [] };
  }

  const membershipRows = await ProjectMember.findAll({
    where: { user_id: userId },
    attributes: ["project_id"],
  });

  const memberProjectIds = membershipRows.map((row) => row.project_id);
  const ownedProjects = await Project.findAll({
    where: { owner_id: userId },
    attributes: ["id"],
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
  });

  const ownedProjectIds = ownedProjects.map((project) => project.id);
  const accessibleProjectIds = [...new Set([...memberProjectIds, ...ownedProjectIds])];

  if (accessibleProjectIds.length === 0) {
    return { tasks: [], projects: [] };
  }

  const likeQuery = `%${query}%`;

  const [tasks, projects] = await Promise.all([
    Task.findAll({
      where: {
        project_id: { [Op.in]: accessibleProjectIds },
        [Op.or]: [
          { title: { [Op.iLike]: likeQuery } },
          { description: { [Op.iLike]: likeQuery } },
          { "$project.name$": { [Op.iLike]: likeQuery } },
        ],
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name"],
          required: true,
        },
      ],
      attributes: ["id", "title", "status", "priority", "updated_at"],
      order: [["updated_at", "DESC"]],
      limit,
      subQuery: false,
    }),
    Project.findAll({
      where: {
        id: { [Op.in]: accessibleProjectIds },
        [Op.or]: [
          { name: { [Op.iLike]: likeQuery } },
          { description: { [Op.iLike]: likeQuery } },
        ],
      },
      attributes: ["id", "name", "description", "status", "updated_at"],
      order: [["updated_at", "DESC"]],
      limit,
    }),
  ]);

  return {
    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      updated_at: task.updated_at,
      project: task.project
        ? {
            id: task.project.id,
            name: task.project.name,
          }
        : null,
    })),
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      updated_at: project.updated_at,
    })),
  };
};
