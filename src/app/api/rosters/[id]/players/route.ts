import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRosterAccess, getAuthErrorMessage, requireWriteUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriteUser(request);
    const { id: rosterId } = await params;
    await assertRosterAccess(user, rosterId);

    const body = await request.json();
    const playerId = String(body?.playerId || "").trim();

    if (!playerId) {
      return NextResponse.json({ error: "PlayerId is required" }, { status: 400 });
    }

    const [roster, player] = await Promise.all([
      prisma.roster.findUnique({ where: { id: rosterId }, select: { id: true } }),
      prisma.player.findUnique({ where: { id: playerId }, select: { id: true } }),
    ]);

    if (!roster) {
      return NextResponse.json({ error: "Roster not found" }, { status: 404 });
    }

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const membership = await prisma.rosterPlayer.upsert({
      where: {
        rosterId_playerId: {
          rosterId,
          playerId,
        },
      },
      create: {
        rosterId,
        playerId,
      },
      update: {},
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error adding player to roster:", error);
    return NextResponse.json({ error: "Failed to add player to roster" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriteUser(request);
    const { id: rosterId } = await params;
    await assertRosterAccess(user, rosterId);

    const body = await request.json();
    const playerId = String(body?.playerId || "").trim();

    if (!playerId) {
      return NextResponse.json({ error: "PlayerId is required" }, { status: 400 });
    }

    await prisma.rosterPlayer.delete({
      where: {
        rosterId_playerId: {
          rosterId,
          playerId,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error removing player from roster:", error);
    return NextResponse.json({ error: "Failed to remove player from roster" }, { status: 500 });
  }
}
