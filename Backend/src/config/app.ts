import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../../config/env/.env") });

export const appConfig = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3000"),
  database: {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432"),
    name: process.env.DATABASE_NAME || "task_tracker",
    user: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "password",
    url:
      process.env.DATABASE_URL ||
      "postgresql://postgres:password@localhost:5432/task_tracker",
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  },
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
  },
};
