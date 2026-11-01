export const MANAGER_PROFILE_ROLE = "moderator";

export function isManagerRole(role) {
  return role === MANAGER_PROFILE_ROLE;
}

export function roleLabel(role) {
  if (isManagerRole(role)) return "Manager";
  if (role === "admin") return "Administrator";
  if (role === "staff") return "Staff";
  return "User";
}
