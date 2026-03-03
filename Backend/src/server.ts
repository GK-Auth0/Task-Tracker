import "reflect-metadata";
import http from "http";
import app from "./app";
import { database, appConfig } from "./config";
import { handleChatUpgrade } from "./realtime/chatSocket";

const startServer = async () => {
  try {
    await database.authenticate();
    console.log("Database connected successfully");

    const server = http.createServer(app);
    server.on("upgrade", (request, socket) => {
      handleChatUpgrade(request, socket);
    });

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
