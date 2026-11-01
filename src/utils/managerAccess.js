export const MANAGER_PROFILE_ROLE = "moderator";
const MANAGER_PROFILE_ROLE_ALIASES = new Set([MANAGER_PROFILE_ROLE, "manager"]);

export function isManagerRole(role) {
  return MANAGER_PROFILE_ROLE_ALIASES.has(role);
}

export function roleLabel(role) {
  if (isManagerRole(role)) return "Manager";
  if (role === "admin") return "Administrator";
  if (role === "staff") return "Staff";
  return "User";
}
