import express from "express";
import helmet from "helmet";
import cors from "cors";
import { corsOptionsDelegate } from "./middleware/cors";
import { errorHandler404 } from "./middleware/errorHandler404";
import { errorHandler } from "./middleware/errorHandler";
import { responseHandler } from "./middleware/responseHandler";
import { setupSwagger } from "./swagger";
import router from "./routes";

const app = express();

// Global middlewares
app.use(cors(corsOptionsDelegate));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseHandler as express.RequestHandler);
app.use(helmet());

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
 */
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Main router
app.use("/api", router);

// 404 handler
app.use(errorHandler404);

// Error handler
app.use(errorHandler);

export default app;