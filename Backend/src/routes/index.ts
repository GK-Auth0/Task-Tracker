import { Router, Request, Response } from "express";
import webhookRoutes from "./webhook";

const router = Router();

// Health check route
router.get("/health", (req: Request, res: Response) => {
  res.json({ status: "API is running" });
});

// Webhook for OTP email delivery when EMAIL_PROVIDER=webhook
router.use("/api/webhook", webhookRoutes);

export default router;
