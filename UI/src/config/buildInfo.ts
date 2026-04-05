import packageJson from "../../package.json";

const getBuildValue = (...values: Array<string | undefined>) => {
  for (const value of values) {
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }
  return undefined;
};

export const buildInfo = {
  service: packageJson.name,
  version: packageJson.version,
  mode: import.meta.env.MODE,
  commit:
    getBuildValue(
      import.meta.env.VITE_APP_COMMIT,
      import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA,
      import.meta.env.VITE_RENDER_GIT_COMMIT,
    ) || "unknown",
  builtAt: getBuildValue(import.meta.env.VITE_APP_BUILT_AT) || null,
};
