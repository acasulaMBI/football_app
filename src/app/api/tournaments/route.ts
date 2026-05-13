import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
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
    const body = await request.json();
    const { name, season } = body;

    if (!name || !season) {
      return NextResponse.json({ error: "Name and season are required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        season,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("Error creating tournament:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
