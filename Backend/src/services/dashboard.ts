import { Task } from "../models";
import { Op } from "sequelize";

export async function getDashboardSummary(userId: string) {
  const now = new Date();

  // Get all tasks for the user (created or assigned)
  const allTasks = await Task.findAll({
    where: {
      [Op.or]: [{ creator_id: userId }, { assignee_id: userId }],
    },
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
