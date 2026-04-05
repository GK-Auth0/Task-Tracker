import packageJson from "../../package.json";
import { appConfig } from "./app";

const getBuildValue = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
};

export const buildInfo = {
  service: packageJson.name,
  version: packageJson.version,
  env: appConfig.env,
  commit:
    getBuildValue(
      "APP_COMMIT_SHA",
      "RENDER_GIT_COMMIT",
      "RENDER_GIT_COMMIT_SHA",
      "VERCEL_GIT_COMMIT_SHA",
      "GITHUB_SHA",
    ) || "unknown",
  deployedAt:
    getBuildValue(
      "APP_DEPLOYED_AT",
      "RENDER_DEPLOYED_AT",
      "VERCEL_DEPLOYMENT_CREATED_AT",
    ) || null,
};
