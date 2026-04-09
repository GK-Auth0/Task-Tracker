export type ApiTaskPriority = "Low" | "Medium" | "High";

export const normalizeTaskPriority = (
  value?: string | null,
): ApiTaskPriority | undefined => {
  if (!value) return undefined;

  const normalized = String(value).trim().toLowerCase();

  if (normalized === "low") return "Low";
  if (normalized === "medium") return "Medium";
  if (normalized === "high") return "High";

  return undefined;
};
