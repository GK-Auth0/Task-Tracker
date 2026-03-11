import { Sequelize } from "sequelize-typescript";
import { appConfig } from "./app";

const sequelizeOptions = appConfig.database.url
  ? {
      url: appConfig.database.url,
      dialect: "postgres" as const,
      logging: appConfig.env === "development" ? console.log : false,
      dialectOptions: {
        ssl: appConfig.database.ssl
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
      },
      // Reduced pool for PgBouncer
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000,
      },
    }
  : {
      database: appConfig.database.name,
      username: appConfig.database.user,
      password: appConfig.database.password,
      host: appConfig.database.host,
      port: appConfig.database.port,
      dialect: "postgres" as const,
      logging: appConfig.env === "development" ? console.log : false,
      dialectOptions: {
        ssl: appConfig.database.ssl
          ? {
              require: true,
              rejectUnauthorized: false,
            }
          : false,
      },
      // Reduced pool for PgBouncer
      pool: {
        max: 5,
        min: 1,
        acquire: 30000,
        idle: 10000,
      },
    };

const database = appConfig.database.url
  ? new Sequelize(appConfig.database.url, sequelizeOptions as any)
  : new Sequelize(sequelizeOptions as any);

// Add models after initialization
import models from "../models";
database.addModels(models);

export default database;
