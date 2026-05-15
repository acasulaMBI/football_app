export const GOAL_TYPE_VALUES = [
  "destro",
  "sinistro",
  "testa",
  "altro",
  "rigore",
  "punizione",
] as const;

export type GoalTypeValue = (typeof GOAL_TYPE_VALUES)[number];

const LEGACY_GOAL_TYPE_MAP: Record<string, GoalTypeValue> = {
  RIGHT_FOOT: "destro",
  LEFT_FOOT: "sinistro",
  HEADER: "testa",
  OTHER: "altro",
  PENALTY: "rigore",
  FREE_KICK: "punizione",
};

export function normalizeGoalType(value: string | null | undefined): GoalTypeValue | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (GOAL_TYPE_VALUES.includes(normalized as GoalTypeValue)) {
    return normalized as GoalTypeValue;
  }

  const legacyMatch = LEGACY_GOAL_TYPE_MAP[value.trim().toUpperCase()];
  return legacyMatch || null;
}

export function isGoalTypeValue(value: string): value is GoalTypeValue {
  return GOAL_TYPE_VALUES.includes(value as GoalTypeValue);
}

export function getGoalTypeLabel(value: string | null | undefined): string | null {
  const normalized = normalizeGoalType(value);
  if (!normalized) return null;

  const labels: Record<GoalTypeValue, string> = {
    destro: "Destro",
    sinistro: "Sinistro",
    testa: "Testa",
    altro: "Altro",
    rigore: "Rigore",
    punizione: "Punizione",
  };

  return labels[normalized];
}
