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

    if (rosterId) {
      await assertRosterAccess(user, rosterId);
    }

    const players = await prisma.player.findMany({
      where: rosterId
        ? {
            rosters: {
              some: {
                rosterId,
              },
            },
          }
        : undefined,
      orderBy: { lastName: 'asc' },
    });
    return NextResponse.json(players);
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireWriteUser(request);
    const activeRosterId = await getActiveRosterIdFromCookies();
    const body = await request.json();
    const { firstName, lastName, role, number, dateOfBirth, rosterId: bodyRosterId } = body;

    const rosterId = String(bodyRosterId || activeRosterId || "").trim();

    if (!rosterId) {
      return NextResponse.json({ error: "Active roster is required" }, { status: 400 });
    }

    await assertRosterAccess(user, rosterId);

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "First name and last name are required" }, { status: 400 });
    }

    const player = await prisma.player.create({
      data: {
        firstName,
        lastName,
        role: role || "UNKNOWN",
        number: number ? parseInt(number, 10) : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        rosters: {
          create: {
            rosterId,
          },
        },
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error creating player:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
