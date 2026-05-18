import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ACCESS_TOKEN_MAX_AGE,
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  createRefreshSession,
  getCookieConfig,
  getAuthErrorMessage,
  signAccessToken,
  verifyPassword,
} from "@/lib/auth";
import { isUserRole } from "@/lib/userRoles";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || "").trim().toLowerCase();
    const password = String(body?.password || "");

    if (!username || !password) {
      return NextResponse.json({ error: "Username e password sono obbligatori" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { username } });

    if (!user || !isUserRole(user.role)) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
    }

    if (user.blocked) {
      return NextResponse.json({ error: "Account bloccato. Contatta l'amministratore." }, { status: 403 });
    }

    const validPassword = await verifyPassword(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    const accessToken = await signAccessToken(safeUser);
    const refreshToken = await createRefreshSession(user.id);

    const response = NextResponse.json({ user: safeUser });
    response.cookies.set(AUTH_TOKEN_COOKIE, accessToken, getCookieConfig(ACCESS_TOKEN_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, getCookieConfig(REFRESH_TOKEN_MAX_AGE));

    return response;
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
