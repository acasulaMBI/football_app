import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";
import {
  assertRosterAccess,
  getAuthErrorMessage,
  requireAuthenticatedUser,
  requireWriteUser,
  resolveRequestedRosterId,
} from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    const activeRosterId = await getActiveRosterIdFromCookies();
    const rosterId = await resolveRequestedRosterId(request, activeRosterId);
    if (!rosterId) {
      return NextResponse.json([]);
    }

    await assertRosterAccess(user, rosterId);

    const url = new URL(request.url);
    const tournamentId = url.searchParams.get("tournamentId");

    const where: {
      rosterId: string;
      tournamentId?: string | null;
    } = { rosterId };

    if (tournamentId) {
      where.tournamentId = tournamentId === "friendly" ? null : tournamentId;
    }

    const matches = await prisma.match.findMany({
      where,
      orderBy: { date: 'asc' },
      include: {
        tournament: true,
      }
    });
    return NextResponse.json(matches);
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireWriteUser(request);
    const activeRosterId = await getActiveRosterIdFromCookies();
    const body = await request.json();
    const { date, opponent, location, duration, tournamentId, rosterId: bodyRosterId } = body;

    const rosterId = String(bodyRosterId || activeRosterId || "").trim();

    if (!rosterId) {
      return NextResponse.json({ error: "Active roster is required" }, { status: 400 });
    }

    await assertRosterAccess(user, rosterId);

    if (!date || !opponent) {
      return NextResponse.json({ error: "Date and opponent are required" }, { status: 400 });
    }

    if (tournamentId) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: String(tournamentId) },
        select: { id: true, rosterId: true },
      });

      if (!tournament) {
        return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
      }

      if (tournament.rosterId !== rosterId) {
        return NextResponse.json(
          { error: "Tournament does not belong to active roster" },
          { status: 400 }
        );
      }
    }

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        opponent,
        location: location || "HOME",
        duration: duration ? parseInt(duration, 10) : 90,
        rosterId,
        tournamentId: tournamentId || null,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
