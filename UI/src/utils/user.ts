export interface ApiUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  /** Legacy field — some endpoints may still include it. Prefer first_name + last_name. */
  full_name?: string;
  email?: string;
  avatar_url?: string;
}

/** Returns a display name from an API user object.
 *  Prefers first_name + last_name, falls back to full_name, then email, then "Unknown".
 */
export function getFullName(user: ApiUser | null | undefined): string {
  if (!user) return "Unknown";
  if (user.first_name || user.last_name) {
    return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  }
  return user.full_name || user.email || "Unknown";
}

/** Returns 1–2 uppercase initials from an API user object. */
export function getUserInitials(user: ApiUser | null | undefined): string {
  const name = getFullName(user);
  if (name === "Unknown") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
