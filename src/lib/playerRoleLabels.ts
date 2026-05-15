export const PLAYER_ROLE_LABELS_IT: Record<string, string> = {
  GOALKEEPER: "Portiere",
  DEFENDER: "Difensore",
  MIDFIELDER: "Centrocampista",
  FORWARD: "Attaccante",
  UNKNOWN: "Sconosciuto",
};

export function getPlayerRoleLabel(role: string | null | undefined): string {
  if (!role) return PLAYER_ROLE_LABELS_IT.UNKNOWN;
  return PLAYER_ROLE_LABELS_IT[role] || PLAYER_ROLE_LABELS_IT.UNKNOWN;
}
