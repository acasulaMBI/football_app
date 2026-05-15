import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRosterAccess, getAuthErrorMessage, requireAuthenticatedUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuthenticatedUser(request);
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        roster: true,
        tournament: true,
        callUps: {
          include: {
            player: true,
          },
        },
        events: {
          include: {
            player: true,
            assist: true,
            subOut: true,
          },
          orderBy: { minute: 'asc' },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    await assertRosterAccess(user, match.rosterId);

    return NextResponse.json(match);
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error fetching match details:", error);
    return NextResponse.json({ error: "Failed to fetch match details" }, { status: 500 });
  }
}
