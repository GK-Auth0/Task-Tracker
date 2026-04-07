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
    const history = Array.isArray(req.body?.history)
      ? req.body.history
          .map((item: any) => ({
            role: item?.role === "assistant" ? "assistant" : "user",
            text: String(item?.text || "").trim(),
          }))
          .filter((item: { role: "user" | "assistant"; text: string }) => item.text)
          .slice(-8)
      : [];

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

    const routeProjectMatch = routeContext.match(/^\/projects\/([^/?#]+)/);
    const routeProjectId = routeProjectMatch?.[1] || "";

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
    const hasRouteProjectAccess = routeProjectId && projectIdSet.has(routeProjectId);
    const projectRows =
      projectIds.length > 0
        ? await Project.findAll({
            where: { id: { [Op.in]: projectIds } },
            attributes: ["id", "name", "status", "priority", "updated_at"],
            order: [["updated_at", "DESC"]],
            limit: 30,
          })
        : [];

    const routeTaskRows =
      hasRouteProjectAccess
        ? await Task.findAll({
            where: { project_id: routeProjectId },
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
            limit: 25,
          })
        : [];

    const routeProject = hasRouteProjectAccess
      ? projectRows.find((project) => project.id === routeProjectId) || null
      : null;

    const mergedTaskMap = new Map<string, any>();
    [...routeTaskRows, ...taskRows].forEach((task) => {
      if (!mergedTaskMap.has(task.id)) {
        mergedTaskMap.set(task.id, task);
      }
    });
    const mergedTasks = Array.from(mergedTaskMap.values());

    const taskSummary = {
      total: mergedTasks.length,
      done: mergedTasks.filter((t) => t.status === "Done").length,
      inProgress: mergedTasks.filter((t) => t.status === "In Progress").length,
      todo: mergedTasks.filter((t) => t.status === "To Do").length,
      highPriorityOpen: mergedTasks.filter(
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
      recentTasks: mergedTasks.slice(0, 24).map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        due_date: t.due_date,
        project_id: t.project_id,
        project_name:
          projectRows.find((project) => project.id === t.project_id)?.name || undefined,
      })),
      routeProject: routeProject
        ? {
            id: routeProject.id,
            name: routeProject.name,
            status: routeProject.status,
            priority: routeProject.priority,
          }
        : null,
    };

    const replyBody = await getAiAssistantReply(
      message,
      routeContext,
      userContext,
      responseMode,
      history,
    );
    const defaultContextSnapshot = `Context Snapshot: ${taskSummary.total} tasks (${taskSummary.done} done, ${taskSummary.inProgress} in progress, ${taskSummary.todo} to do), ${taskSummary.highPriorityOpen} high-priority open, ${projectRows.length} projects.`;
    return res.status(200).json({
      success: true,
      data: {
        reply: replyBody.reply,
        contextSnapshot: replyBody.contextSnapshot || defaultContextSnapshot,
        quickActions: replyBody.quickActions || [],
        provider: replyBody.provider || "unknown",
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
