import "reflect-metadata";
import app from "./app";
import { database, appConfig } from "./config";

const startServer = async () => {
  try {
    await database.authenticate();
    console.log("Database connected successfully");

    app.listen(appConfig.port, () => {
      console.log(`Server running on port ${appConfig.port}`);
      console.log(`Environment: ${appConfig.env}`);
      console.log(`Swagger docs: http://localhost:${appConfig.port}/api-docs`);
    });
  } catch (error) {
    console.error("Unable to start server:", error);
    process.exit(1);
  }
};

startServer();