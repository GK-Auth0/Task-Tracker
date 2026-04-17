import type { ApiUser } from "../utils/user";
import { getFullName, getUserInitials } from "../utils/user";

const sizeMap = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-xs",
  md: "size-8 text-sm",
  lg: "size-10 text-base",
};

interface UserAvatarProps {
  user: ApiUser | null | undefined;
  size?: keyof typeof sizeMap;
  className?: string;
  /** Show full name as a tooltip on hover */
  showTooltip?: boolean;
}

/**
 * Renders a circular avatar for an API user.
 * Displays the user's avatar image if available, otherwise shows initials.
 * Accepts both { first_name, last_name } and legacy { full_name } shapes.
 */
export default function UserAvatar({
  user,
  size = "sm",
  className = "",
  showTooltip = false,
}: UserAvatarProps) {
  const initials = getUserInitials(user);
  const fullName = getFullName(user);
  const sizeClass = sizeMap[size];

  const baseClass = `rounded-full flex items-center justify-center font-bold shrink-0 ${sizeClass} ${className}`;

  const inner =
    user?.avatar_url ? (
      <img
        src={user.avatar_url}
        alt={fullName}
        className={`${baseClass} object-cover`}
        title={showTooltip ? fullName : undefined}
      />
    ) : (
      <div
        className={`${baseClass} bg-blue-600/20 text-blue-700`}
        title={showTooltip ? fullName : undefined}
      >
        {initials}
      </div>
    );

  return inner;
}
