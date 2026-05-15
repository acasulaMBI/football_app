import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPasswordHash, getAuthErrorMessage, requireAdminUser } from "@/lib/auth";
import { USER_ROLES, isUserRole } from "@/lib/userRoles";

function randomPassword() {
  return randomBytes(12).toString("base64url");
}

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const body = await request.json();

    const username = String(body?.username || "").trim().toLowerCase();
    const rawEmail = String(body?.email || "").trim().toLowerCase();
    const email = rawEmail || null;
    const firstName = String(body?.firstName || "").trim();
    const lastName = String(body?.lastName || "").trim();
    const roleRaw = String(body?.role || "VIEWER").trim().toUpperCase();
    const providedPassword = String(body?.password || "").trim();

    if (!username || !firstName || !lastName) {
      return NextResponse.json({ error: "Username, nome e cognome sono obbligatori" }, { status: 400 });
    }

    if (!isUserRole(roleRaw)) {
      return NextResponse.json({ error: `Ruolo non valido. Valori ammessi: ${USER_ROLES.join(", ")}` }, { status: 400 });
    }

    const plainPassword = providedPassword || randomPassword();
    if (plainPassword.length < 8) {
      return NextResponse.json({ error: "La password deve avere almeno 8 caratteri" }, { status: 400 });
    }

    const passwordHash = await createPasswordHash(plainPassword);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        firstName,
        lastName,
        role: roleRaw,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user, generatedPassword: providedPassword ? null : plainPassword }, { status: 201 });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status === 500) {
      return NextResponse.json({ error: "Impossibile creare utente (username/email duplicati?)" }, { status: 409 });
    }

    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
