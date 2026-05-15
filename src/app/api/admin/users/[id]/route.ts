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
    const roleRaw = String(body?.role || "").trim().toUpperCase();

    if (!isUserRole(roleRaw)) {
      return NextResponse.json({ error: `Ruolo non valido. Valori ammessi: ${USER_ROLES.join(", ")}` }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role: roleRaw },
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

    return NextResponse.json({ user });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status === 500) {
      return NextResponse.json({ error: "Impossibile aggiornare il ruolo utente" }, { status: 400 });
    }

    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
