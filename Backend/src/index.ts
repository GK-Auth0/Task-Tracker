import express, { Request, Response } from "express";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/projects";
import taskRoutes from "./routes/task";
import userRoutes from "./routes/user";
import dashboardRoutes from "./routes/dashboard";
import auditLogRoutes from "./routes/auditLog";

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/projects", projectRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/users", userRoutes);
router.use("/api/dashboard", dashboardRoutes);
router.use("/api/audit-logs", auditLogRoutes);

// Health check route
router.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Task Tracker API is running" });
});

export default router;
