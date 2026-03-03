export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const parseBoundedInt = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return clampNumber(parsed, min, max);
};

export const parseIsoDate = (value: unknown): Date | undefined => {
  if (typeof value !== "string" || !value.trim()) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
};
