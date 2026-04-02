import "reflect-metadata";
import http from "http";
import app from "./app";
import { database, appConfig, validateRuntimeConfig } from "./config";
import { handleChatUpgrade } from "./realtime/chatSocket";

let isShuttingDown = false;

const getPublicBaseUrl = () => {
  const configuredUrl =
    process.env.BACKEND_PUBLIC_URL ||
    process.env.API_BASE_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.PUBLIC_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  return `http://localhost:${appConfig.port}`;
};

const registerProcessGuards = (server: http.Server) => {
  const gracefulShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.warn(`[shutdown] Received ${signal}. Closing server gracefully...`);

    server.close(async () => {
      try {
        await database.close();
      } catch (error) {
        console.error("[shutdown] Failed to close database connection:", error);
      } finally {
        process.exit(0);
      }
    });

    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  process.on("uncaughtException", (error) => {
    console.error("[runtime] Uncaught exception captured:", error);
  });

  process.on("unhandledRejection", (reason) => {
    console.error("[runtime] Unhandled rejection captured:", reason);
  });
};

const startServer = async () => {
  try {
    validateRuntimeConfig();
    await database.authenticate();
    console.log("Database connected successfully");

    const server = http.createServer(app);
    server.requestTimeout = 30000;
    server.headersTimeout = 35000;
    server.keepAliveTimeout = 10000;
    server.on("upgrade", (request, socket) => {
      try {
        handleChatUpgrade(request, socket);
      } catch (error) {
        console.error("[websocket] Upgrade handling failed:", error);
        socket.destroy();
      }
    });
    registerProcessGuards(server);

    server.listen(appConfig.port, () => {
      const publicBaseUrl = getPublicBaseUrl();
      const websocketBaseUrl = publicBaseUrl.replace(/^http/, "ws");

      console.log(`Server running on port ${appConfig.port}`);
      console.log(`Environment: ${appConfig.env}`);
      console.log(`API docs: ${publicBaseUrl}/api-docs`);
      console.log(`Chat websocket: ${websocketBaseUrl}/ws/chat`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
