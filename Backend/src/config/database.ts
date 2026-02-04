import { Sequelize } from "sequelize-typescript";
import { appConfig } from "./app";
import path from "path";

const database = new Sequelize({
  database: appConfig.database.name,
  username: appConfig.database.user,
  password: appConfig.database.password,
  host: appConfig.database.host,
  port: appConfig.database.port,
  dialect: "postgres",
  models: [
    path.join(__dirname, "../models/user.ts"),
    path.join(__dirname, "../models/project.ts"),
    path.join(__dirname, "../models/ProjectMember.ts"),
    path.join(__dirname, "../models/ProjectFile.ts"),
    path.join(__dirname, "../models/task.ts"),
    path.join(__dirname, "../models/TaskAssignee.ts"),
    path.join(__dirname, "../models/subtask.ts"),
    path.join(__dirname, "../models/comment.ts"),
    path.join(__dirname, "../models/label.ts"),
    path.join(__dirname, "../models/taskLabel.ts"),
    path.join(__dirname, "../models/pullRequest.ts"),
    path.join(__dirname, "../models/commit.ts"),
    path.join(__dirname, "../models/userMetadata.ts"),
    path.join(__dirname, "../models/auditLog.ts")
  ],
  logging: appConfig.env === "development" ? console.log : false,
  dialectOptions: {
    ssl: appConfig.env === "production" ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

export default database;
