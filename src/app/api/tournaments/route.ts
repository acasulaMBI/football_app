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

    const tournaments = await prisma.tournament.findMany({
      where: { rosterId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(tournaments);
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error fetching tournaments:", error);
    return NextResponse.json({ error: "Failed to fetch tournaments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireWriteUser(request);
    const activeRosterId = await getActiveRosterIdFromCookies();
    const body = await request.json();
    const { name, season, rosterId: bodyRosterId } = body;

    const rosterId = String(bodyRosterId || activeRosterId || "").trim();

    if (!rosterId) {
      return NextResponse.json({ error: "Active roster is required" }, { status: 400 });
    }

    await assertRosterAccess(user, rosterId);

    if (!name || !season) {
      return NextResponse.json({ error: "Name and season are required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        season,
        rosterId,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error creating tournament:", error);
    return NextResponse.json({ error: "Failed to create tournament" }, { status: 500 });
  }
}
