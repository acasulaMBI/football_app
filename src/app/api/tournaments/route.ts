import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveRosterIdFromCookies } from "@/lib/activeRosterServer";

export async function GET() {
  try {
    const activeRosterId = await getActiveRosterIdFromCookies();
    if (!activeRosterId) {
      return NextResponse.json([]);
    }

    const tournaments = await prisma.tournament.findMany({
      where: { rosterId: activeRosterId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tournaments);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const activeRosterId = await getActiveRosterIdFromCookies();
    const body = await request.json();
    const { name, season } = body;

    if (!activeRosterId) {
      return NextResponse.json({ error: "Active roster is required" }, { status: 400 });
    }

    if (!name || !season) {
      return NextResponse.json({ error: "Name and season are required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        season,
        rosterId: activeRosterId,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
