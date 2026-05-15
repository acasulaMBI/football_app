import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthErrorMessage, requireAuthenticatedUser, requireWriteUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);

    const rosters = await prisma.roster.findMany({
      where:
        user.role === "ADMIN"
          ? undefined
          : {
              OR: [{ ownerId: user.id }, { ownerId: null }],
            },
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
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error fetching rosters:", error);
    return NextResponse.json({ error: "Failed to fetch rosters" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireWriteUser(request);
    const body = await request.json();
    const name = String(body?.name || "").trim();

    if (!name) {
      return NextResponse.json({ error: "Roster name is required" }, { status: 400 });
    }

    const roster = await prisma.roster.create({
      data: {
        name,
        ownerId: user.id,
      },
    });

    return NextResponse.json(roster, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error creating roster:", error);
    return NextResponse.json({ error: "Failed to create roster" }, { status: 500 });
  }
}
