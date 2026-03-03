import express, { Request, Response } from "express";
import router from ".";
import helmet from "helmet";
import cors from "cors";
import { corsOptionsDelegate } from "./middleware/cors";
import { errorHandler404 } from "./middleware/errorHandler404";
import { errorHandler } from "./middleware/errorHandler";
import { responseHandler } from "./middleware/responseHandler";
import { setupSwagger } from "./swagger";
import { globalRateLimiter } from "./middleware/rateLimit";
import { requestTimeoutGuard } from "./middleware/requestGuard";
import { database, appConfig } from "./config";

const app = express();

// Global middlewares
app.use(cors(corsOptionsDelegate));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(responseHandler as express.RequestHandler);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: appConfig.isProduction,
  }),
);
app.use(requestTimeoutGuard);
app.use(globalRateLimiter);

// Trust proxy for accurate IP addresses
app.set("trust proxy", appConfig.security.trustProxy as any);

// Swagger documentation
setupSwagger(app);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/ready", async (_req: Request, res: Response) => {
  try {
    await database.query("SELECT 1");
    return res.status(200).json({ status: "ready" });
  } catch (error) {
    return res.status(503).json({ status: "not_ready" });
  }
});

// Main router
app.use(router);

// 404 handler
app.use(errorHandler404);

// Error handler
app.use(errorHandler);

export default app;
