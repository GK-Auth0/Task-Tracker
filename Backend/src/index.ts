import express, { Request, Response } from "express";
import authRoutes from "./routes/auth";
import projectRoutes from "./routes/project";
import taskRoutes from "./routes/task";
import userRoutes from "./routes/user";
import dashboardRoutes from "./routes/dashboard";

const router = express.Router();

router.use("/api/auth", authRoutes);
router.use("/api/projects", projectRoutes);
router.use("/api/tasks", taskRoutes);
router.use("/api/users", userRoutes);
router.use("/api/dashboard", dashboardRoutes);

// Health check route
router.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "Task Tracker API is running" });
});

export default router;