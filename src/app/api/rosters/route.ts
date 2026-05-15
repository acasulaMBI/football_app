import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const rosters = await prisma.roster.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            players: true,
            matches: true,
            tournaments: true,
          },
        },
      },
    });

    return NextResponse.json(rosters);
  } catch (error) {
    console.error("Error fetching rosters:", error);
    return NextResponse.json({ error: "Failed to fetch rosters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Roster name is required" }, { status: 400 });
    }

    const roster = await prisma.roster.create({
      data: { name },
    });

    return NextResponse.json(roster, { status: 201 });
  } catch (error) {
    console.error("Error creating roster:", error);
    return NextResponse.json({ error: "Failed to create roster" }, { status: 500 });
  }
}
