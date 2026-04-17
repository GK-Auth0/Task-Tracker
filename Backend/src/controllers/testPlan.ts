import { Response } from "express";
import { Op } from "sequelize";
import { Project, Sprint, TestCase, TestPlan, TestRun, User } from "../models";
import {
  AuthenticatedRequest,
  ensureProjectAccess,
  getAccessibleProjects,
} from "./testManagementShared";

const normalizeSuiteNames = (values: unknown) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

const getPlanCaseCount = (plan: any, testCases: any[]) => {
  const suiteNames = Array.isArray(plan.suite_names) ? plan.suite_names : [];
  return testCases.filter((testCase) => {
    if (testCase.project_id !== plan.project_id) return false;
    if (!suiteNames.length) return true;
    return suiteNames.includes(testCase.suite);
  }).length;
};

const serializePlan = (
  plan: any,
  counts: { caseCount: number; runCount: number },
) => ({
  id: plan.id,
  reference_code: plan.reference_code,
  name: plan.name,
  sprint_id: plan.sprint_id || plan.sprint?.id || null,
  sprint_name: plan.sprint?.name || plan.sprint_name,
  release_name: plan.release_name,
  status: plan.status,
  suite_names: Array.isArray(plan.suite_names) ? plan.suite_names : [],
  project_id: plan.project_id,
  owner_id: plan.owner_id,
  created_at: plan.created_at,
  updated_at: plan.updated_at,
  case_count: counts.caseCount,
  run_count: counts.runCount,
  project: plan.project
    ? {
        id: plan.project.id,
        name: plan.project.name,
      }
    : null,
  owner: plan.owner
    ? {
        id: plan.owner.id,
        full_name: plan.owner.full_name,
        email: plan.owner.email,
      }
    : null,
  sprint: plan.sprint
    ? {
        id: plan.sprint.id,
        name: plan.sprint.name,
        status: plan.sprint.status,
      }
    : null,
});

export const listTestPlans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const projects = await getAccessibleProjects(userId);
    const projectIds = projects.map((project) => project.id);
    if (!projectIds.length) {
      return res.status(200).json({ success: true, data: [] });
    }

    const projectFilterId = req.query.project_id ? String(req.query.project_id) : "";
    const scopedProjectIds =
      projectFilterId && projectIds.includes(projectFilterId) ? [projectFilterId] : projectIds;
    const where: any = { project_id: { [Op.in]: scopedProjectIds } };
    if (req.query.sprint_id) where.sprint_id = String(req.query.sprint_id);

    const [plans, testCases, runs] = await Promise.all([
      TestPlan.findAll({
        where,
        include: [
          { model: Project, as: "project", attributes: ["id", "name"] },
          { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
          { model: Sprint, as: "sprint", attributes: ["id", "name", "status"] },
        ],
        order: [["updated_at", "DESC"]],
      }),
      TestCase.findAll({
        where: { project_id: { [Op.in]: scopedProjectIds } },
        attributes: ["id", "project_id", "suite"],
      }),
      TestRun.findAll({
        where: { project_id: { [Op.in]: scopedProjectIds } },
        attributes: ["id", "plan_id"],
      }),
    ]);

    const runCounts = runs.reduce<Record<string, number>>((acc, run: any) => {
      acc[run.plan_id] = (acc[run.plan_id] || 0) + 1;
      return acc;
    }, {});

    return res.status(200).json({
      success: true,
      data: plans.map((plan) => {
        const plain = plan.get({ plain: true });
        return serializePlan(plain, {
          caseCount: getPlanCaseCount(plain, testCases),
          runCount: runCounts[plain.id] || 0,
        });
      }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test plans",
      error: (error as any)?.message,
    });
  }
};

export const createTestPlanRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const projectId = String(req.body.project_id || "");
    const sprintId = req.body.sprint_id ? String(req.body.sprint_id) : undefined;
    const project = await ensureProjectAccess(projectId, userId, req.user?.role);
    if (!project) {
      return res.status(403).json({ success: false, message: "Access denied to this project" });
    }

    let resolvedSprintName: string | null = req.body.sprint_name ? String(req.body.sprint_name).trim() : null;
    if (sprintId) {
      const sprint = await Sprint.findOne({
        where: {
          id: sprintId,
          project_id: projectId,
        },
        attributes: ["id", "name"],
      });
      if (!sprint) {
        return res.status(400).json({
          success: false,
          message: "Sprint must belong to the selected project",
        });
      }
      resolvedSprintName = sprint.name;
    }

    const plan = await TestPlan.create({
      name: String(req.body.name || "").trim(),
      project_id: projectId,
      owner_id: userId,
      sprint_id: sprintId,
      sprint_name: resolvedSprintName,
      release_name: req.body.release_name ? String(req.body.release_name).trim() : null,
      status: req.body.status || "Draft",
      suite_names: normalizeSuiteNames(req.body.suite_names),
    });

    const created = await TestPlan.findByPk(plan.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
        { model: Sprint, as: "sprint", attributes: ["id", "name", "status"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Test plan created successfully",
      data: serializePlan(created?.get({ plain: true }), {
        caseCount: 0,
        runCount: 0,
      }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create test plan",
      error: (error as any)?.message,
    });
  }
};
