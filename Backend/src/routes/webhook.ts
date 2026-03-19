import { Router } from "express";
import { processOtpWebhook } from "../controllers/webhook";

const router = Router();

router.post("/send-otp", processOtpWebhook);

export default router;
