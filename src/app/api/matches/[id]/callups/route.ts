import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playerId, status } = body;

    if (!playerId) {
      return NextResponse.json({ error: "PlayerId is required" }, { status: 400 });
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
    console.error("Error creating/updating call up:", error);
    return NextResponse.json({ error: "Failed to save call up" }, { status: 500 });
  }
}
