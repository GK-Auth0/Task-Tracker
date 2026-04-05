import express, { Request, Response } from "express";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/task";
import userRoutes from "./routes/user";
import dashboardRoutes from "./routes/dashboard";
import auditLogRoutes from "./routes/auditLog";
import chatRoutes from "./routes/chat";
import aiRoutes from "./routes/ai";
import preferencesRoutes from "./routes/preferences";
import webhookRoutes from "./routes/webhook";
import inviteRoutes from "./routes/invite";
import organizationRoutes from "./routes/organization";
import defectRoutes from "./routes/defect";
import testCaseRoutes from "./routes/testCase";
import sprintRoutes from "./routes/sprint";

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/projects", projectRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/v1/tasks", taskRoutes);
router.use("/api/users", userRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/audit-logs", auditLogRoutes);
router.use("/api/chat", chatRoutes);
router.use("/api/ai", aiRoutes);
router.use("/api/preferences", preferencesRoutes);
router.use("/api/webhook", webhookRoutes);
router.use("/api/invites", inviteRoutes);
router.use("/api/organizations", organizationRoutes);
router.use("/api/defects", defectRoutes);
router.use("/api/test-cases", testCaseRoutes);
router.use("/api/sprints", sprintRoutes);

// Health check route
router.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Task Tracker API is running" });
});

export default router;
