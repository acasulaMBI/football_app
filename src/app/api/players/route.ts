import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const players = await prisma.player.findMany({
      orderBy: { lastName: 'asc' }
    });
    return NextResponse.json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json({ error: "Failed to fetch players" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, role, number, dateOfBirth } = body;

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
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 });
  }
}
