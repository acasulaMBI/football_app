import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";

export async function GET() {
  try {
    const activeRosterId = await getActiveRosterIdFromCookies();
    if (!activeRosterId) {
      return NextResponse.json([]);
    }

    const matches = await prisma.match.findMany({
      where: { rosterId: activeRosterId },
      orderBy: { date: 'asc' },
      include: {
        tournament: true,
      }
    });
    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const activeRosterId = await getActiveRosterIdFromCookies();
    const body = await request.json();
    const { date, opponent, location, duration, tournamentId } = body;

    if (!activeRosterId) {
      return NextResponse.json({ error: "Active roster is required" }, { status: 400 });
    }

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

      if (tournament.rosterId !== activeRosterId) {
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
        rosterId: activeRosterId,
        tournamentId: tournamentId || null,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
