import fs from "fs/promises";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { Project, ProjectMember, Sprint, Task, TestCase, User } from "../models";
import cloudinary from "../config/cloudinary";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    role?: string;
  };
};

const isWorkspaceAdmin = (role: unknown) =>
  String(role || "").trim().toLowerCase() === "admin";

const getRequesterOrganizationId = async (userId: string) => {
  const requester = await User.findByPk(userId, {
    attributes: ["id", "organization_id"],
  });

  return requester?.organization_id || null;
};

const ensureProjectAccess = async (projectId: string, userId: string, role?: string) => {
  const organizationId = await getRequesterOrganizationId(userId);
  if (!organizationId) return null;

  const project = await Project.findOne({
    where: { id: projectId },
    include: [
      {
        model: User,
        as: "owner",
        attributes: ["id", "organization_id"],
        where: { organization_id: organizationId },
      },
    ],
  });

  if (!project) return null;
  if (project.owner_id === userId || isWorkspaceAdmin(role)) return project;

  const membership = await ProjectMember.findOne({
    where: {
      project_id: projectId,
      user_id: userId,
    },
    attributes: ["id"],
  });

  return membership ? project : null;
};

const serializeTestCase = (testCase: any) => ({
  id: testCase.id,
  reference_code: testCase.reference_code,
  title: testCase.title,
  suite: testCase.suite,
  module: testCase.module,
  sprint_name: testCase.sprint_name,
  priority: testCase.priority,
  status: testCase.status,
  automation: testCase.automation,
  tags: Array.isArray(testCase.tags) ? testCase.tags : [],
  preconditions: Array.isArray(testCase.preconditions) ? testCase.preconditions : [],
  steps: Array.isArray(testCase.steps) ? testCase.steps : [],
  linked_items: Array.isArray(testCase.linked_items) ? testCase.linked_items : [],
  execution_history: Array.isArray(testCase.execution_history)
    ? testCase.execution_history
    : [],
  project_id: testCase.project_id,
  linked_task_id: testCase.linked_task_id,
  owner_id: testCase.owner_id,
  created_at: testCase.created_at,
  updated_at: testCase.updated_at,
  project: testCase.project
    ? {
        id: testCase.project.id,
        name: testCase.project.name,
      }
    : null,
  owner: testCase.owner
    ? {
        id: testCase.owner.id,
        full_name: testCase.owner.full_name,
        email: testCase.owner.email,
      }
    : null,
  linked_task: testCase.linked_task
    ? {
        id: testCase.linked_task.id,
        title: testCase.linked_task.title,
      }
    : null,
});

export const listTestCases = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const organizationId = await getRequesterOrganizationId(userId);
    if (!organizationId) {
      return res.status(200).json({ success: true, data: [] });
    }

    const projects = await Project.findAll({
      attributes: ["id"],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id"],
          where: { organization_id: organizationId },
        },
      ],
    });

    const projectIds = projects.map((project) => project.id);
    if (!projectIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const where: any = {
      project_id: {
        [Op.in]: projectIds,
      },
    };

    if (req.query.project_id) where.project_id = String(req.query.project_id);
    if (req.query.status) where.status = String(req.query.status);
    if (req.query.automation) where.automation = String(req.query.automation);

    const testCases = await TestCase.findAll({
      where,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
      ],
      order: [["updated_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: testCases.map((item) => serializeTestCase(item.get({ plain: true }))),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test cases",
      error: (error as any)?.message,
    });
  }
};

export const getTestCaseFormOptions = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const organizationId = await getRequesterOrganizationId(userId);
    if (!organizationId) {
      return res.status(200).json({
        success: true,
        data: {
          projects: [],
          tasks: [],
          sprints: [],
          suites: [],
          modules: [],
        },
      });
    }

    const projects = await Project.findAll({
      attributes: ["id", "name"],
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id"],
          where: { organization_id: organizationId },
        },
      ],
      order: [["name", "ASC"]],
    });

    const projectIds = projects.map((project) => project.id);
    if (!projectIds.length) {
      return res.status(200).json({
        success: true,
        data: {
          projects: [],
          tasks: [],
          sprints: [],
          suites: [],
          modules: [],
        },
      });
    }

    const projectFilterId = req.query.project_id ? String(req.query.project_id) : "";
    const scopedProjectIds =
      projectFilterId && projectIds.includes(projectFilterId) ? [projectFilterId] : projectIds;

    const [tasks, sprints, existingTestCases] = await Promise.all([
      Task.findAll({
        where: { project_id: { [Op.in]: scopedProjectIds } },
        attributes: ["id", "title", "project_id"],
        include: [{ model: Project, as: "project", attributes: ["id", "name"] }],
        order: [["updated_at", "DESC"]],
        limit: 300,
      }),
      Sprint.findAll({
        where: { project_id: { [Op.in]: scopedProjectIds } },
        attributes: ["id", "name", "project_id", "status", "start_date", "end_date"],
        include: [{ model: Project, as: "project", attributes: ["id", "name"] }],
        order: [["updated_at", "DESC"]],
        limit: 200,
      }),
      TestCase.findAll({
        where: { project_id: { [Op.in]: scopedProjectIds } },
        attributes: ["suite", "module", "sprint_name"],
        order: [["updated_at", "DESC"]],
      }),
    ]);

    const uniqueValues = (values: Array<string | null | undefined>) =>
      Array.from(
        new Set(
          values
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right));

    return res.status(200).json({
      success: true,
      data: {
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
        })),
        tasks: tasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          project: task.project
            ? {
                id: task.project.id,
                name: task.project.name,
              }
            : null,
        })),
        sprints: sprints.map((sprint: any) => ({
          id: sprint.id,
          name: sprint.name,
          project_id: sprint.project_id,
          status: sprint.status,
          start_date: sprint.start_date,
          end_date: sprint.end_date,
          project: sprint.project
            ? {
                id: sprint.project.id,
                name: sprint.project.name,
              }
            : null,
        })),
        suites: uniqueValues(existingTestCases.map((item: any) => item.suite)),
        modules: uniqueValues(existingTestCases.map((item: any) => item.module)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test case form options",
      error: (error as any)?.message,
    });
  }
};

export const createTestCaseRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const projectId = String(req.body.project_id || "");
    const linkedTaskId = req.body.linked_task_id ? String(req.body.linked_task_id) : undefined;
    const project = await ensureProjectAccess(projectId, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    if (linkedTaskId) {
      const linkedTask = await Task.findOne({
        where: {
          id: linkedTaskId,
          project_id: projectId,
        },
        attributes: ["id"],
      });
      if (!linkedTask) {
        return res.status(400).json({
          success: false,
          message: "Linked task must belong to the selected project",
        });
      }
    }

    const testCase = await TestCase.create({
      title: String(req.body.title || "").trim(),
      project_id: projectId,
      linked_task_id: linkedTaskId,
      owner_id: userId,
      suite: String(req.body.suite || "").trim(),
      module: String(req.body.module || "").trim(),
      sprint_name: req.body.sprint_name ? String(req.body.sprint_name).trim() : null,
      priority: req.body.priority,
      status: req.body.status || "Draft",
      automation: req.body.automation,
      tags: Array.isArray(req.body.tags) ? req.body.tags : [],
      preconditions: Array.isArray(req.body.preconditions) ? req.body.preconditions : [],
      steps: Array.isArray(req.body.steps) ? req.body.steps : [],
      linked_items: Array.isArray(req.body.linked_items) ? req.body.linked_items : [],
      execution_history: Array.isArray(req.body.execution_history)
        ? req.body.execution_history
        : [],
    });

    const created = await TestCase.findByPk(testCase.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Test case created successfully",
      data: serializeTestCase(created?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create test case",
      error: (error as any)?.message,
    });
  }
};

export const updateTestCaseRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const testCaseId = String(req.params.id || "");
    const testCase = await TestCase.findByPk(testCaseId);
    if (!testCase) {
      return res.status(404).json({ success: false, message: "Test case not found" });
    }

    const projectId = String(req.body.project_id || "");
    const linkedTaskId = req.body.linked_task_id ? String(req.body.linked_task_id) : undefined;
    const project = await ensureProjectAccess(projectId, userId, req.user?.role);
    if (!project || testCase.project_id !== projectId) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    if (linkedTaskId) {
      const linkedTask = await Task.findOne({
        where: {
          id: linkedTaskId,
          project_id: projectId,
        },
        attributes: ["id"],
      });
      if (!linkedTask) {
        return res.status(400).json({
          success: false,
          message: "Linked task must belong to the selected project",
        });
      }
    }

    testCase.title = String(req.body.title || "").trim();
    testCase.project_id = projectId;
    testCase.linked_task_id = linkedTaskId;
    testCase.suite = String(req.body.suite || "").trim();
    testCase.module = String(req.body.module || "").trim();
    testCase.sprint_name = req.body.sprint_name ? String(req.body.sprint_name).trim() : null as any;
    testCase.priority = req.body.priority;
    testCase.status = req.body.status || testCase.status;
    testCase.automation = req.body.automation;
    testCase.tags = Array.isArray(req.body.tags) ? req.body.tags : [];
    testCase.preconditions = Array.isArray(req.body.preconditions) ? req.body.preconditions : [];
    testCase.steps = Array.isArray(req.body.steps) ? req.body.steps : [];
    testCase.linked_items = Array.isArray(req.body.linked_items) ? req.body.linked_items : [];
    await testCase.save();

    const updated = await TestCase.findByPk(testCase.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Test case updated successfully",
      data: serializeTestCase(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update test case",
      error: (error as any)?.message,
    });
  }
};

export const addTestCaseExecution = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const testCaseId = String(req.params.id || "");
    const testCase = await TestCase.findByPk(testCaseId, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
      ],
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: "Test case not found" });
    }

    const project = await ensureProjectAccess(testCase.project_id, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this test case" });
    }

    const status = String(req.body.status || "") as "Passed" | "Failed" | "Blocked";
    const cycle = String(req.body.cycle || "").trim() || testCase.sprint_name || "Manual run";
    const note = String(req.body.note || "").trim();
    const actualBehavior = String(req.body.actual_behavior || "").trim();
    const attachments = Array.isArray(req.body.attachments)
      ? req.body.attachments
          .map((item: any) => ({
            url: String(item?.url || "").trim(),
            name: String(item?.name || "").trim(),
            type: String(item?.type || "").trim() || "file",
          }))
          .filter((item: { url: string; name: string; type: string }) => item.url && item.name)
      : [];

    if (status === "Failed" && !actualBehavior) {
      return res.status(400).json({
        success: false,
        message: "Actual behavior is required when the execution status is Failed",
      });
    }

    const currentHistory = Array.isArray(testCase.execution_history) ? testCase.execution_history : [];
    const executor = await User.findByPk(userId, {
      attributes: ["id", "full_name"],
    });

    const nextEntry = {
      id: `exec-${Date.now()}`,
      cycle,
      status,
      tester: executor?.full_name || "Current user",
      executedAt: new Date().toISOString(),
      note,
      actual_behavior: actualBehavior || "",
      attachments,
    };

    testCase.execution_history = [nextEntry, ...currentHistory];
    testCase.status = status;
    await testCase.save();

    const updated = await TestCase.findByPk(testCase.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "full_name", "email"] },
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Execution saved successfully",
      data: serializeTestCase(updated?.get({ plain: true })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to save test execution",
      error: (error as any)?.message,
    });
  }
};

export const uploadTestCaseExecutionAttachment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const file = (req as any).file;
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const testCaseId = String(req.params.id || "");
    const testCase = await TestCase.findByPk(testCaseId, {
      attributes: ["id", "project_id"],
    });

    if (!testCase) {
      return res.status(404).json({ success: false, message: "Test case not found" });
    }

    const project = await ensureProjectAccess(testCase.project_id, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this test case" });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return res.status(503).json({
        success: false,
        message: "Attachment service is not configured",
      });
    }

    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: `task-tracker/test-cases/${testCaseId}/executions`,
      resource_type: "auto",
    });

    return res.status(200).json({
      success: true,
      data: {
        url: uploadResult.secure_url,
        name: file.originalname,
        type: String(file.mimetype || "").startsWith("image/") ? "image" : "file",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to upload execution attachment",
      error: (error as any)?.message,
    });
  } finally {
    if (file?.path) {
      await fs.unlink(file.path).catch(() => undefined);
    }
  }
};
