import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createPasswordHash,
  getAuthErrorMessage,
  requireAdminUser,
  revokeAllUserSessions,
} from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const plainPassword = String(body?.password || "").trim();

    if (!plainPassword) {
      return NextResponse.json({ error: "La nuova password e obbligatoria" }, { status: 400 });
    }

    if (plainPassword.length < 8) {
      return NextResponse.json({ error: "La password deve avere almeno 8 caratteri" }, { status: 400 });
    }

    const passwordHash = await createPasswordHash(plainPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await revokeAllUserSessions(id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status === 500) {
      return NextResponse.json({ error: "Impossibile resettare password" }, { status: 400 });
    }

    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
