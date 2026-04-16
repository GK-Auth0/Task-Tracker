export interface NameParts {
  first_name?: string | null;
  last_name?: string | null;
}

const normalizeNamePart = (value: string | null | undefined) =>
  String(value || "").trim();

export const buildFullName = ({ first_name, last_name }: NameParts) =>
  [normalizeNamePart(first_name), normalizeNamePart(last_name)]
    .filter(Boolean)
    .join(" ")
    .trim();

export const splitFullName = (fullName: string | null | undefined) => {
  const normalized = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!normalized) {
    return { first_name: "", last_name: "" };
  }

  const [first_name, ...rest] = normalized.split(" ");
  return {
    first_name,
    last_name: rest.join(" "),
  };
};

export const getUserDisplayName = (user?: NameParts | null) => {
  const fullName = buildFullName(user || {});
  return fullName || "Unknown User";
};
