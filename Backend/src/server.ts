import "reflect-metadata";
import http from "http";
import app from "./app";
import { database, appConfig, validateRuntimeConfig } from "./config";
import { handleChatUpgrade } from "./realtime/chatSocket";

let isShuttingDown = false;

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
      console.log(`Server running on port ${appConfig.port}`);
      console.log(`Environment: ${appConfig.env}`);
      console.log(`Swagger docs: http://localhost:${appConfig.port}/api-docs`);
      console.log(`Chat websocket: ws://localhost:${appConfig.port}/ws/chat`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();
