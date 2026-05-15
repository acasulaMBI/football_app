export const USER_ROLES = ["ADMIN", "EDITOR", "VIEWER"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS_IT: Record<UserRole, string> = {
  ADMIN: "Amministratore",
  EDITOR: "Editor",
  VIEWER: "Visualizzatore",
};

export function isUserRole(value: string): value is UserRole {
  return USER_ROLES.includes(value as UserRole);
}

export function canWrite(role: UserRole): boolean {
  return role === "ADMIN" || role === "EDITOR";
}

export function isAdmin(role: UserRole): boolean {
  return role === "ADMIN";
}
