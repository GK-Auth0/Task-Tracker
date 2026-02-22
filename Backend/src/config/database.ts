import { Sequelize } from "sequelize-typescript";
import { appConfig } from "./app";

const database = new Sequelize({
  database: appConfig.database.name,
  username: appConfig.database.user,
  password: appConfig.database.password,
  host: appConfig.database.host,
  port: appConfig.database.port,
  dialect: "postgres",
  logging: appConfig.env === "development" ? console.log : false,
  dialectOptions: {
    ssl: appConfig.env === "production" ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

// Add models after initialization
import models from "../models";
database.addModels(models);

export default database;
