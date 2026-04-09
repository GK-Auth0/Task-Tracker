import { Response } from "express";
import { Op } from "sequelize";
import { Defect, Sprint, Task, TestCase, TestPlan, TestRun } from "../models";
import {
  AuthenticatedRequest,
  getAccessibleProjects,
  getLatestCaseExecution,
} from "./testManagementShared";

const getCoverageLabel = (statuses: string[]) => {
  if (!statuses.length) return "Gap";
  if (statuses.some((status) => status === "Failed" || status === "Blocked")) return "At Risk";
  if (statuses.every((status) => status === "Passed")) return "Covered";
  return "Draft";
};

export const getTraceabilityMatrix = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
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

    const scopedProjectIds =
      req.query.project_id && projectIds.includes(String(req.query.project_id))
        ? [String(req.query.project_id)]
        : projectIds;

    const testCases = await TestCase.findAll({
      where: { project_id: { [Op.in]: scopedProjectIds } },
      attributes: [
        "id",
        "reference_code",
        "title",
        "project_id",
        "linked_items",
        "linked_task_id",
        "status",
        "sprint_name",
        "sprint_id",
        "updated_at",
        "execution_history",
      ],
      include: [
        { model: Task, as: "linked_task", attributes: ["id", "title"] },
        { model: Sprint, as: "sprint", attributes: ["id", "name", "status"] },
      ],
      order: [["updated_at", "DESC"]],
    });

    const rowMap = new Map<string, any>();

    testCases.forEach((testCase: any) => {
      const plain = testCase.get({ plain: true });
      const linkedItems = Array.isArray(plain.linked_items) ? plain.linked_items : [];
      const traceableItems = linkedItems.filter((item: any) =>
        ["Requirement", "Story"].includes(String(item?.type || "")),
      );
      const latestExecution = getLatestCaseExecution(plain);

      const fallbackItems =
        traceableItems.length || plain.linked_task
          ? []
          : [{ id: `UNLINKED-${plain.project_id}`, type: "Gap", title: "Unlinked test cases" }];

      [...traceableItems, ...fallbackItems].forEach((item: any) => {
        const key = `${item.type}:${item.id}`;
        const current = rowMap.get(key) || {
          id: item.id,
          requirement: item.title,
          linkedStory: plain.linked_task?.title || "No linked story",
          linkedCases: [],
          statuses: [],
          latestExecution,
          latestRun: latestExecution.cycle,
        };

        current.linkedCases.push(plain.reference_code);
        current.statuses.push(latestExecution.status);

        if (
          new Date(String(latestExecution.executedAt || 0)).getTime() >=
          new Date(String(current.latestExecution?.executedAt || 0)).getTime()
        ) {
          current.latestExecution = latestExecution;
          current.latestRun = latestExecution.cycle;
        }

        rowMap.set(key, current);
      });
    });

    return res.status(200).json({
      success: true,
      data: Array.from(rowMap.values()).map((row) => ({
        id: row.id,
        requirement: row.requirement,
        linkedStory: row.linkedStory,
        linkedCases: Array.from(new Set(row.linkedCases)),
        coverage: getCoverageLabel(row.statuses),
        latestRun: row.latestRun || "Not executed",
      })),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch traceability matrix",
      error: (error as any)?.message,
    });
  }
};

export const getTestReportsSummary = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const projects = await getAccessibleProjects(userId);
    const projectIds = projects.map((project) => project.id);
    if (!projectIds.length) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            total_cases: 0,
            automated_cases: 0,
            linked_cases: 0,
            plan_count: 0,
            run_count: 0,
            pass_rate: 0,
            open_defects: 0,
            resolved_defects: 0,
          },
          latest_run_health: [],
        },
      });
    }

    const [testCases, plans, runs, defects] = await Promise.all([
      TestCase.findAll({
        where: { project_id: { [Op.in]: projectIds } },
        attributes: [
          "id",
          "project_id",
          "suite",
          "status",
          "automation",
          "linked_task_id",
          "execution_history",
          "updated_at",
          "sprint_name",
          "sprint_id",
        ],
        include: [{ model: Sprint, as: "sprint", attributes: ["id", "name", "status"] }],
      }),
      TestPlan.findAll({
        where: { project_id: { [Op.in]: projectIds } },
        attributes: ["id", "project_id", "suite_names", "name", "reference_code", "status"],
      }),
      TestRun.findAll({
        where: { project_id: { [Op.in]: projectIds } },
        attributes: ["id", "plan_id", "project_id", "name", "environment", "status", "updated_at"],
        order: [["updated_at", "DESC"]],
      }),
      Defect.findAll({
        where: { project_id: { [Op.in]: projectIds } },
        attributes: ["id", "status"],
      }),
    ]);

    const plansById = plans.reduce<Record<string, any>>((acc, plan: any) => {
      acc[plan.id] = plan;
      return acc;
    }, {});

    const latestRunHealth = runs.slice(0, 6).map((run: any) => {
      const plan = plansById[run.plan_id];
      const suiteNames = Array.isArray(plan?.suite_names) ? plan.suite_names : [];
      const matchedCases = testCases.filter((testCase: any) => {
        if (testCase.project_id !== run.project_id) return false;
        if (!suiteNames.length) return true;
        return suiteNames.includes(testCase.suite);
      });

      const passed = matchedCases.filter(
        (testCase: any) => getLatestCaseExecution(testCase).status === "Passed",
      ).length;

      return {
        id: run.id,
        name: run.name,
        environment: run.environment,
        status: run.status,
        updated_at: run.updated_at,
        pass_rate: matchedCases.length ? Math.round((passed / matchedCases.length) * 100) : 0,
      };
    });

    const executedCases = testCases.filter(
      (testCase: any) => getLatestCaseExecution(testCase).status !== "Pending",
    );
    const passedCases = executedCases.filter(
      (testCase: any) => getLatestCaseExecution(testCase).status === "Passed",
    );

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          total_cases: testCases.length,
          automated_cases: testCases.filter((item: any) => item.automation === "Automated").length,
          linked_cases: testCases.filter((item: any) => Boolean(item.linked_task_id)).length,
          plan_count: plans.length,
          run_count: runs.length,
          pass_rate: executedCases.length
            ? Math.round((passedCases.length / executedCases.length) * 100)
            : 0,
          open_defects: defects.filter((item: any) => item.status !== "Resolved").length,
          resolved_defects: defects.filter((item: any) => item.status === "Resolved").length,
        },
        latest_run_health: latestRunHealth,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch test reports summary",
      error: (error as any)?.message,
    });
  }
};
