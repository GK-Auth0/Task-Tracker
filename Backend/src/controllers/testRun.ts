import { Response } from "express";
import { Op } from "sequelize";
import { Project, Sprint, TestCase, TestPlan, TestRun, User } from "../models";
import {
  AuthenticatedRequest,
  getAccessibleProjects,
  getLatestCaseExecution,
} from "./testManagementShared";

const getMatchedPlanCases = (plan: any, testCases: any[]) => {
  const suiteNames = Array.isArray(plan?.suite_names) ? plan.suite_names : [];
  return testCases.filter((testCase) => {
    if (testCase.project_id !== plan.project_id) return false;
    if (!suiteNames.length) return true;
    return suiteNames.includes(testCase.suite);
  });
};

const getRunStats = (run: any, plan: any, testCases: any[]) => {
  const matchedCases = getMatchedPlanCases(plan, testCases);
  return matchedCases.reduce(
    (acc, testCase) => {
      const latest = getLatestCaseExecution(testCase);
      if (latest.status === "Passed") acc.passed += 1;
      else if (latest.status === "Failed") acc.failed += 1;
      else if (latest.status === "Blocked") acc.blocked += 1;
      else acc.pending += 1;
      acc.total += 1;
      return acc;
    },
    { total: 0, passed: 0, failed: 0, blocked: 0, pending: 0 },
  );
};

const serializeRun = (run: any, plan: any, stats: ReturnType<typeof getRunStats>) => ({
  id: run.id,
  reference_code: run.reference_code,
  name: run.name,
  environment: run.environment,
  status: run.status,
  notes: run.notes,
  plan_id: run.plan_id,
  project_id: run.project_id,
  owner_id: run.owner_id,
  sprint_id: run.sprint_id || plan?.sprint_id || plan?.sprint?.id || null,
  created_at: run.created_at,
  updated_at: run.updated_at,
  total_cases: stats.total,
  passed: stats.passed,
  failed: stats.failed,
  blocked: stats.blocked,
  pending: stats.pending,
  pass_rate: stats.total ? Math.round((stats.passed / stats.total) * 100) : 0,
  plan: plan
    ? {
        id: plan.id,
        reference_code: plan.reference_code,
        name: plan.name,
        status: plan.status,
        suite_names: Array.isArray(plan.suite_names) ? plan.suite_names : [],
      }
    : null,
  sprint: run.sprint || plan?.sprint
    ? {
        id: (run.sprint || plan?.sprint).id,
        name: (run.sprint || plan?.sprint).name,
        status: (run.sprint || plan?.sprint).status,
      }
    : null,
  project: run.project
    ? {
        id: run.project.id,
        name: run.project.name,
      }
    : null,
  owner: run.owner
    ? {
        id: run.owner.id,
        full_name: run.owner.full_name,
        email: run.owner.email,
      }
    : null,
});

export const listTestRuns = async (req: AuthenticatedRequest, res: Response) => {
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

    const where: any = { project_id: { [Op.in]: projectIds } };
    if (req.query.project_id && projectIds.includes(String(req.query.project_id))) {
      where.project_id = String(req.query.project_id);
    }
    if (req.query.plan_id) {
      where.plan_id = String(req.query.plan_id);
    }
    if (req.query.sprint_id) {
      where.sprint_id = String(req.query.sprint_id);
    }

    const runs = await TestRun.findAll({
      where,
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
        { model: Sprint, as: "sprint", attributes: ["id", "name", "status"] },
        { model: TestPlan, as: "plan", attributes: ["id", "reference_code", "name", "status", "suite_names", "project_id", "sprint_id"] },
      ],
      order: [["updated_at", "DESC"]],
    });

    const scopedProjectIds = Array.from(new Set(runs.map((run) => run.project_id)));
    const testCases = await TestCase.findAll({
      where: { project_id: { [Op.in]: scopedProjectIds } },
      attributes: ["id", "project_id", "suite", "status", "sprint_name", "sprint_id", "updated_at", "execution_history"],
      include: [{ model: Sprint, as: "sprint", attributes: ["id", "name", "status"] }],
    });

    return res.status(200).json({
      success: true,
      data: runs.map((run) => {
        const plain = run.get({ plain: true });
        const stats = getRunStats(plain, plain.plan, testCases);
        return serializeRun(plain, plain.plan, stats);
      }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test runs",
      error: (error as any)?.message,
    });
  }
};

export const createTestRunRecord = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const planId = String(req.body.plan_id || "");
    const plan = await TestPlan.findByPk(planId, {
      attributes: ["id", "project_id", "name", "status", "suite_names", "reference_code", "sprint_id"],
      include: [{ model: Sprint, as: "sprint", attributes: ["id", "name", "status"] }],
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: "Test plan not found" });
    }

    const accessibleProjects = await getAccessibleProjects(userId);
    const accessibleProjectIds = accessibleProjects.map((project) => project.id);
    if (!accessibleProjectIds.includes(plan.project_id)) {
      return res.status(403).json({ success: false, message: "Access denied to this test plan" });
    }

    const run = await TestRun.create({
      name: String(req.body.name || "").trim(),
      plan_id: plan.id,
      project_id: plan.project_id,
      owner_id: userId,
      sprint_id: (plan as any).sprint_id || null,
      environment: String(req.body.environment || "").trim(),
      status: req.body.status || "Planned",
      notes: req.body.notes ? String(req.body.notes).trim() : null,
    });

    const created = await TestRun.findByPk(run.id, {
      include: [
        { model: Project, as: "project", attributes: ["id", "name"] },
        { model: User, as: "owner", attributes: ["id", "first_name", "last_name", "email"] },
        { model: Sprint, as: "sprint", attributes: ["id", "name", "status"] },
        { model: TestPlan, as: "plan", attributes: ["id", "reference_code", "name", "status", "suite_names", "project_id", "sprint_id"] },
      ],
    });

    return res.status(201).json({
      success: true,
      message: "Test run created successfully",
      data: serializeRun(created?.get({ plain: true }), created?.get({ plain: true }).plan, {
        total: 0,
        passed: 0,
        failed: 0,
        blocked: 0,
        pending: 0,
      }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create test run",
      error: (error as any)?.message,
    });
  }
};
