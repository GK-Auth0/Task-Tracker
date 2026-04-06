import { appConfig } from "./app";

const isWeakSecret = (secret: string) => secret.length < 32;

export const validateRuntimeConfig = () => {
  const errors: string[] = [];

  if (!appConfig.jwt.accessSecret) {
    errors.push("JWT_ACCESS_SECRET or JWT_SECRET is required.");
  } else if (isWeakSecret(appConfig.jwt.accessSecret)) {
    errors.push("JWT access secret must be at least 32 characters.");
  }

  if (!appConfig.jwt.refreshSecret) {
    errors.push("JWT_REFRESH_SECRET or JWT_SECRET is required.");
  } else if (isWeakSecret(appConfig.jwt.refreshSecret)) {
    errors.push("JWT refresh secret must be at least 32 characters.");
  }

  if (!appConfig.database.url) {
    if (!appConfig.database.host) errors.push("DATABASE_HOST/DB_HOST is required.");
    if (!appConfig.database.name) errors.push("DATABASE_NAME/DB_NAME is required.");
    if (!appConfig.database.user) errors.push("DATABASE_USER/DB_USER is required.");
    if (!appConfig.database.password) {
      errors.push("DATABASE_PASSWORD/DB_PASSWORD is required.");
    }
  }

  if (appConfig.isProduction && appConfig.cors.allowedOrigins.length === 0) {
    errors.push("ALLOWED_ORIGINS must be set in production.");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid runtime configuration:\n- ${errors.join("\n- ")}`);
  }
};
