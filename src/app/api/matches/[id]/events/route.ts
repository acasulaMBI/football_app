import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_EVENT_TYPES = new Set([
  "GOAL",
  "SUBSTITUTION",
  "OPPONENT_GOAL",
  "YELLOW_CARD",
  "RED_CARD_DIRECT",
  "RED_CARD_SECOND_YELLOW",
]);

type EligiblePlayersAtMinute = {
  activePlayers: Set<string>;
  benchPlayers: Set<string>;
};

function getEligiblePlayersAtMinute(
  starters: string[],
  bench: string[],
  substitutions: Array<{ minute: number; playerId: string | null; subOutId: string | null }>
): EligiblePlayersAtMinute {
  const activePlayers = new Set(starters);
  const benchPlayers = new Set(bench);

  for (const substitution of substitutions) {
    if (substitution.subOutId) {
      activePlayers.delete(substitution.subOutId);
    }

    if (substitution.playerId) {
      activePlayers.add(substitution.playerId);
    }
  }

  return { activePlayers, benchPlayers };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { minute, type, playerId, goalType, assistId, subOutId } = body;
    const parsedMinute = Number.parseInt(String(minute), 10);
    const normalizedType = String(type || "").trim();

    if (!Number.isInteger(parsedMinute) || parsedMinute < 0 || !normalizedType) {
      return NextResponse.json({ error: "Minute and type are required" }, { status: 400 });
    }

    if (!ALLOWED_EVENT_TYPES.has(normalizedType)) {
      return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
    }

    if (normalizedType !== "OPPONENT_GOAL" && !playerId) {
      return NextResponse.json({ error: "Player is required for this event type" }, { status: 400 });
    }

    if (normalizedType === "SUBSTITUTION" && !subOutId) {
      return NextResponse.json({ error: "subOutId is required for substitutions" }, { status: 400 });
    }

    if (normalizedType !== "GOAL" && assistId) {
      return NextResponse.json({ error: "Assist is allowed only for goals" }, { status: 400 });
    }

    if (normalizedType === "GOAL" && assistId && assistId === playerId) {
      return NextResponse.json({ error: "Scorer and assist player must be different" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        roster: {
          include: {
            players: {
              select: {
                playerId: true,
              },
            },
          },
        },
        callUps: true,
        events: {
          where: {
            type: "SUBSTITUTION",
            minute: { lt: parsedMinute },
          },
          orderBy: { minute: "asc" },
          select: {
            minute: true,
            playerId: true,
            subOutId: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const calledPlayers = new Set(
      match.callUps.filter((callUp) => callUp.status !== "NOT_CALLED").map((callUp) => callUp.playerId)
    );
    const rosterPlayers = new Set(match.roster.players.map((item) => item.playerId));

    if (playerId && !rosterPlayers.has(playerId)) {
      return NextResponse.json(
        { error: "Selected player does not belong to match roster" },
        { status: 400 }
      );
    }

    if (assistId && !rosterPlayers.has(assistId)) {
      return NextResponse.json(
        { error: "Assist player does not belong to match roster" },
        { status: 400 }
      );
    }

    if (subOutId && !rosterPlayers.has(subOutId)) {
      return NextResponse.json(
        { error: "Player out does not belong to match roster" },
        { status: 400 }
      );
    }

    if (playerId && !calledPlayers.has(playerId)) {
      return NextResponse.json(
        { error: "Selected player is not called up for this match" },
        { status: 400 }
      );
    }

    if (assistId && !calledPlayers.has(assistId)) {
      return NextResponse.json(
        { error: "Assist player is not called up for this match" },
        { status: 400 }
      );
    }

    if (subOutId && !calledPlayers.has(subOutId)) {
      return NextResponse.json(
        { error: "Player out is not called up for this match" },
        { status: 400 }
      );
    }

    if (normalizedType === "SUBSTITUTION") {
      if (playerId === subOutId) {
        return NextResponse.json(
          { error: "Player in and player out must be different" },
          { status: 400 }
        );
      }

      const starters = match.callUps
        .filter((callUp) => callUp.status === "STARTER")
        .map((callUp) => callUp.playerId);
      const bench = match.callUps
        .filter((callUp) => callUp.status === "BENCH")
        .map((callUp) => callUp.playerId);

      const { activePlayers, benchPlayers } = getEligiblePlayersAtMinute(
        starters,
        bench,
        match.events
      );

      if (!playerId || !benchPlayers.has(playerId)) {
        return NextResponse.json(
          { error: "Player in must be selected from bench players" },
          { status: 400 }
        );
      }

      if (!subOutId || !activePlayers.has(subOutId)) {
        return NextResponse.json(
          { error: "Player out must be currently on the field" },
          { status: 400 }
        );
      }

      if (activePlayers.has(playerId)) {
        return NextResponse.json(
          { error: "Player in is already on the field" },
          { status: 400 }
        );
      }
    }

    const event = await prisma.matchEvent.create({
      data: {
        matchId: id,
        minute: parsedMinute,
        type: normalizedType,
        playerId: playerId || null,
        goalType: normalizedType === "GOAL" ? goalType || null : null,
        assistId: normalizedType === "GOAL" ? assistId || null : null,
        subOutId: subOutId || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating match event:", error);
    return NextResponse.json({ error: "Failed to create match event" }, { status: 500 });
  }
}
