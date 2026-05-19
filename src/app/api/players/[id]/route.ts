import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthErrorMessage, requireWriteUser } from "@/lib/auth";

const PLAYER_ROLES = new Set(["UNKNOWN", "GOALKEEPER", "DEFENDER", "MIDFIELDER", "FORWARD"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireWriteUser(request);
    const { id } = await params;
    const body = await request.json();

    const firstName = String(body?.firstName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const roleRaw = String(body?.role || "UNKNOWN").trim().toUpperCase();
    const numberRaw = body?.number;
    const dateOfBirthRaw = body?.dateOfBirth;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: "Nome e cognome sono obbligatori" }, { status: 400 });
    }

    if (!PLAYER_ROLES.has(roleRaw)) {
      return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
    }

    const parsedNumber =
      numberRaw === null || numberRaw === undefined || String(numberRaw).trim() === ""
        ? null
        : Number.parseInt(String(numberRaw), 10);

    if (parsedNumber !== null && (!Number.isInteger(parsedNumber) || parsedNumber < 1 || parsedNumber > 99)) {
      return NextResponse.json({ error: "Numero maglia non valido (1-99)" }, { status: 400 });
    }

    const parsedDate =
      dateOfBirthRaw === null || dateOfBirthRaw === undefined || String(dateOfBirthRaw).trim() === ""
        ? null
        : new Date(String(dateOfBirthRaw));

    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: "Data di nascita non valida" }, { status: 400 });
    }

    if (user.role !== "ADMIN" && user.role !== "EDITOR") {
      const accessibleMembership = await prisma.rosterPlayer.findFirst({
        where: {
          playerId: id,
          roster: {
            OR: [{ ownerId: user.id }, { ownerId: null }],
          },
        },
        select: { id: true },
      });

      if (!accessibleMembership) {
        return NextResponse.json({ error: "Accesso negato a questo giocatore" }, { status: 403 });
      }
    }

    const updated = await prisma.player.update({
      where: { id },
      data: {
        firstName,
        lastName,
        role: roleRaw,
        number: parsedNumber,
        dateOfBirth: parsedDate,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        number: true,
        dateOfBirth: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ player: updated });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Giocatore non trovato" }, { status: 404 });
    }

    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error updating player:", error);
    return NextResponse.json({ error: "Impossibile aggiornare il giocatore" }, { status: 500 });
  }
}