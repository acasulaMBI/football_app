type MatchLike = {
  id: string;
  date: Date;
  opponent: string;
  location: string;
  duration: number;
  callUps: Array<{ playerId: string; status: string }>;
  events: Array<{
    minute: number;
    type: string;
    playerId: string | null;
    assistId: string | null;
    subOutId: string | null;
  }>;
};

export type PlayerSummaryStats = {
  playerId: string;
  firstName: string;
  lastName: string;
  goals: number;
  minutesPlayed: number;
  matchesPlayed: number;
  assists: number;
  yellowCards: number;
  redCardsDirect: number;
  redCardsSecondYellow: number;
};

export type PlayerMatchDetail = {
  matchId: string;
  date: Date;
  opponent: string;
  location: string;
  started: boolean;
  enteredAt: number | null;
  leftAt: number | null;
  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCardsDirect: number;
  redCardsSecondYellow: number;
};

export type PlayerDetailedStats = PlayerSummaryStats & {
  matches: PlayerMatchDetail[];
};

type Participation = {
  started: boolean;
  enteredAt: number | null;
  leftAt: number | null;
  minutesPlayed: number;
};

function getParticipation(match: MatchLike, playerId: string): Participation {
  const callUp = match.callUps.find((item) => item.playerId === playerId);
  if (!callUp || callUp.status === "NOT_CALLED") {
    return {
      started: false,
      enteredAt: null,
      leftAt: null,
      minutesPlayed: 0,
    };
  }

  const substitutions = [...match.events]
    .filter((event) => event.type === "SUBSTITUTION")
    .sort((a, b) => a.minute - b.minute);

  let enteredAt: number | null = callUp.status === "STARTER" ? 0 : null;
  if (enteredAt === null) {
    const subIn = substitutions.find((event) => event.playerId === playerId);
    enteredAt = subIn ? subIn.minute : null;
  }

  if (enteredAt === null) {
    return {
      started: false,
      enteredAt: null,
      leftAt: null,
      minutesPlayed: 0,
    };
  }

  const subOut = substitutions.find((event) => event.subOutId === playerId && event.minute >= enteredAt);
  const leftAt = subOut ? subOut.minute : null;

  const rawExit = leftAt ?? match.duration;
  const safeEntry = Math.max(0, enteredAt);
  const safeExit = Math.max(safeEntry, Math.min(rawExit, match.duration));

  return {
    started: callUp.status === "STARTER",
    enteredAt: safeEntry,
    leftAt,
    minutesPlayed: safeExit - safeEntry,
  };
}

export function computePlayerSummary(
  player: { id: string; firstName: string; lastName: string },
  matches: MatchLike[]
): PlayerSummaryStats {
  let goals = 0;
  let assists = 0;
  let yellowCards = 0;
  let redCardsDirect = 0;
  let redCardsSecondYellow = 0;
  let minutesPlayed = 0;
  let matchesPlayed = 0;

  for (const match of matches) {
    const participation = getParticipation(match, player.id);
    minutesPlayed += participation.minutesPlayed;
    if (participation.minutesPlayed > 0) {
      matchesPlayed += 1;
    }

    for (const event of match.events) {
      if (event.playerId === player.id && event.type === "GOAL") goals += 1;
      if (event.assistId === player.id && event.type === "GOAL") assists += 1;
      if (event.playerId === player.id && event.type === "YELLOW_CARD") yellowCards += 1;
      if (event.playerId === player.id && event.type === "RED_CARD_DIRECT") redCardsDirect += 1;
      if (event.playerId === player.id && event.type === "RED_CARD_SECOND_YELLOW") redCardsSecondYellow += 1;
    }
  }

  return {
    playerId: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    goals,
    minutesPlayed,
    matchesPlayed,
    assists,
    yellowCards,
    redCardsDirect,
    redCardsSecondYellow,
  };
}

export function computePlayerDetailedStats(
  player: { id: string; firstName: string; lastName: string },
  matches: MatchLike[]
): PlayerDetailedStats {
  const summary = computePlayerSummary(player, matches);

  const details = matches
    .map((match) => {
      const participation = getParticipation(match, player.id);

      let goals = 0;
      let assists = 0;
      let yellowCards = 0;
      let redCardsDirect = 0;
      let redCardsSecondYellow = 0;

      for (const event of match.events) {
        if (event.playerId === player.id && event.type === "GOAL") goals += 1;
        if (event.assistId === player.id && event.type === "GOAL") assists += 1;
        if (event.playerId === player.id && event.type === "YELLOW_CARD") yellowCards += 1;
        if (event.playerId === player.id && event.type === "RED_CARD_DIRECT") redCardsDirect += 1;
        if (event.playerId === player.id && event.type === "RED_CARD_SECOND_YELLOW") redCardsSecondYellow += 1;
      }

      return {
        matchId: match.id,
        date: match.date,
        opponent: match.opponent,
        location: match.location,
        started: participation.started,
        enteredAt: participation.enteredAt,
        leftAt: participation.leftAt,
        minutesPlayed: participation.minutesPlayed,
        goals,
        assists,
        yellowCards,
        redCardsDirect,
        redCardsSecondYellow,
      };
    })
    .filter((item) => item.minutesPlayed > 0 || item.goals > 0 || item.assists > 0 || item.yellowCards > 0 || item.redCardsDirect > 0 || item.redCardsSecondYellow > 0)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return {
    ...summary,
    matches: details,
  };
}
