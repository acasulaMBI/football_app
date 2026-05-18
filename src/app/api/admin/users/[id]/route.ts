import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthErrorMessage, requireAdminUser } from "@/lib/auth";
import { USER_ROLES, isUserRole } from "@/lib/userRoles";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser(request);
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body?.role !== undefined) {
      const roleRaw = String(body.role).trim().toUpperCase();
      if (!isUserRole(roleRaw)) {
        return NextResponse.json({ error: `Ruolo non valido. Valori ammessi: ${USER_ROLES.join(", ")}` }, { status: 400 });
      }
      data.role = roleRaw;
    }

    if (body?.blocked !== undefined) {
      data.blocked = Boolean(body.blocked);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nessun campo da aggiornare" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        blocked: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status === 500) {
      return NextResponse.json({ error: "Impossibile aggiornare l'utente" }, { status: 400 });
    }

    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdminUser(request);
    const { id } = await params;

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status === 500) {
      return NextResponse.json({ error: "Impossibile eliminare l'utente" }, { status: 400 });
    }

    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
