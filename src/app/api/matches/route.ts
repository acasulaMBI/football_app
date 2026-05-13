import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
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
    const body = await request.json();
    const { date, opponent, location, duration, tournamentId } = body;

    if (!date || !opponent) {
      return NextResponse.json({ error: "Date and opponent are required" }, { status: 400 });
    }

    const match = await prisma.match.create({
      data: {
        date: new Date(date),
        opponent,
        location: location || "HOME",
        duration: duration ? parseInt(duration, 10) : 90,
        tournamentId: tournamentId || null,
      },
    });

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json({ error: "Failed to create match" }, { status: 500 });
  }
}
