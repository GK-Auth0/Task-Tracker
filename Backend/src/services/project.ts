import { Project, Task } from "../models";
import { Op } from "sequelize";

interface CreateProjectDto {
  name: string;
  description?: string;
  owner_id: string;
}

export async function getAllProjects(userId: string) {
  const projects = await Project.findAll({
    where: {
      [Op.or]: [
        { owner_id: userId },
        // Add team member access later if needed
      ],
    },
    include: [
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "status"],
      },
    ],
  });

  // Add statistics to each project
  const projectsWithStats = projects.map((project) => {
    const tasks = project.tasks || [];
    const stats = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((task: any) => task.status === "Completed").length,
      in_progress_tasks: tasks.filter((task: any) => task.status === "In Progress").length,
      todo_tasks: tasks.filter((task: any) => task.status === "To Do").length,
    };

    return {
      ...project.get({ plain: true }),
      statistics: stats,
    };
  });

  return projectsWithStats;
}

export async function createProject(dto: CreateProjectDto) {
  const project = await Project.create({
    name: dto.name,
    description: dto.description,
    owner_id: dto.owner_id,
    status: "Active",
  });

  return project.get({ plain: true });
}

export async function getProjectById(projectId: string, userId: string) {
  const project = await Project.findOne({
    where: {
      id: projectId,
      [Op.or]: [
        { owner_id: userId },
        // Add team member access later if needed
      ],
    },
    include: [
      {
        model: Task,
        as: "tasks",
        attributes: ["id", "title", "status", "priority", "created_at"],
      },
    ],
  });

  if (!project) {
    throw new Error("Project not found or access denied");
  }

  const tasks = project.tasks || [];
  const stats = {
    total_tasks: tasks.length,
    completed_tasks: tasks.filter((task: any) => task.status === "Completed").length,
    in_progress_tasks: tasks.filter((task: any) => task.status === "In Progress").length,
    todo_tasks: tasks.filter((task: any) => task.status === "To Do").length,
  };

  return {
    ...project.get({ plain: true }),
    statistics: stats,
  };
}