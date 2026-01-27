import { Sequelize } from "sequelize-typescript";
import { appConfig } from "./app";

const database = new Sequelize({
  database: appConfig.database.name,
  username: appConfig.database.user,
  password: appConfig.database.password,
  host: appConfig.database.host,
  port: appConfig.database.port,
  dialect: "postgres",
  models: [__dirname + "/../models"],
  logging: appConfig.env === "development" ? console.log : false,
});

export default database;