import { Request, Response } from "express";
import { getAiAssistantReply } from "../services/ai";
import { Op } from "sequelize";
import { Project, ProjectMember, Task } from "../models";

export const chatWithAssistant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const message = String(req.body?.message || "").trim();
    const routeContext = String(req.body?.routeContext || "").trim();
    const responseMode = String(req.body?.responseMode || "balanced").trim() as
      | "concise"
      | "balanced"
      | "detailed";

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Message is too long",
      });
    }

    const [taskRows, membershipRows, ownedRows] = await Promise.all([
      Task.findAll({
        where: {
          [Op.or]: [{ assignee_id: userId }, { creator_id: userId }],
        },
        attributes: [
          "id",
          "title",
          "status",
          "priority",
          "due_date",
          "project_id",
          "updated_at",
        ],
        order: [["updated_at", "DESC"]],
        limit: 50,
      }),
      ProjectMember.findAll({
        where: { user_id: userId },
        attributes: ["project_id"],
      }),
      Project.findAll({
        where: { owner_id: userId },
        attributes: ["id"],
      }),
    ]);

    const projectIdSet = new Set<string>();
    membershipRows.forEach((row) => projectIdSet.add(row.project_id));
    ownedRows.forEach((row) => projectIdSet.add(row.id));

    const projectIds = Array.from(projectIdSet);
    const projectRows =
      projectIds.length > 0
        ? await Project.findAll({
            where: { id: { [Op.in]: projectIds } },
            attributes: ["id", "name", "status", "priority", "updated_at"],
            order: [["updated_at", "DESC"]],
            limit: 30,
          })
        : [];

    const taskSummary = {
      total: taskRows.length,
      done: taskRows.filter((t) => t.status === "Done").length,
      inProgress: taskRows.filter((t) => t.status === "In Progress").length,
      todo: taskRows.filter((t) => t.status === "To Do").length,
      highPriorityOpen: taskRows.filter(
        (t) => t.priority === "High" && t.status !== "Done",
      ).length,
    };

    const userContext = {
      summary: {
        tasks: taskSummary,
        projectsCount: projectRows.length,
      },
      projects: projectRows.slice(0, 12).map((p) => ({
        id: p.id,
        name: p.name,
        status: p.status,
        priority: p.priority,
      })),
      recentTasks: taskRows.slice(0, 20).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        project_id: t.project_id,
      })),
    };

    const replyBody = await getAiAssistantReply(
      message,
      routeContext,
      userContext,
      responseMode,
    );
    const contextSnapshot = `Context Snapshot: ${taskSummary.total} tasks (${taskSummary.done} done, ${taskSummary.inProgress} in progress, ${taskSummary.todo} to do), ${taskSummary.highPriorityOpen} high-priority open, ${projectRows.length} projects.`;
    const reply = `${contextSnapshot}\n\n${replyBody}`;
    return res.status(200).json({
      success: true,
      data: {
        reply,
        contextSnapshot,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process AI request",
      error: (error as any).message,
    });
  }
};
