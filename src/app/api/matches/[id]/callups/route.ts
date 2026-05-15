import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assertRosterAccess,
  getAuthErrorMessage,
  requireWriteUser,
} from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriteUser(request);
    const { id } = await params;
    const body = await request.json();
    const { playerId, status } = body;

    if (!playerId) {
      return NextResponse.json({ error: "PlayerId is required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id },
      select: { id: true, rosterId: true },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    await assertRosterAccess(user, match.rosterId);

    const membership = await prisma.rosterPlayer.findUnique({
      where: {
        rosterId_playerId: {
          rosterId: match.rosterId,
          playerId,
        },
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Player does not belong to match roster" },
        { status: 400 }
      );
    }

    // Upsert callup
    const callUp = await prisma.callUp.upsert({
      where: {
        matchId_playerId: {
          matchId: id,
          playerId,
        },
      },
      update: {
        status: status || "BENCH",
      },
      create: {
        matchId: id,
        playerId,
        status: status || "BENCH",
      },
    });

    return NextResponse.json(callUp, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error creating/updating call up:", error);
    return NextResponse.json({ error: "Failed to save call up" }, { status: 500 });
  }
}
