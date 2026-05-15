import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordHash } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const usersCount = await prisma.user.count();
    if (usersCount > 0) {
      return NextResponse.json({ error: "Bootstrap non disponibile" }, { status: 403 });
    }

    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const rawEmail = String(body?.email || "").trim().toLowerCase();
    const email = rawEmail || null;
    const firstName = String(body?.firstName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const password = String(body?.password || "");

    if (!username || !firstName || !lastName || password.length < 8) {
      return NextResponse.json(
        { error: "Username, nome, cognome e password (>=8) sono obbligatori" },
        { status: 400 }
      );
    }

    const passwordHash = await createPasswordHash(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        firstName,
        lastName,
        passwordHash,
        role: "ADMIN",
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Impossibile completare bootstrap admin" }, { status: 500 });
  }
}
