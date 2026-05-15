import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ACCESS_TOKEN_MAX_AGE,
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  getCookieConfig,
  getAuthErrorMessage,
  rotateRefreshSession,
  signAccessToken,
} from "@/lib/auth";
import { isUserRole } from "@/lib/userRoles";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshPair = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

    const rawRefreshToken = refreshPair
      ? decodeURIComponent(refreshPair.split("=").slice(1).join("="))
      : "";

    if (!rawRefreshToken) {
      return NextResponse.json({ error: "Refresh token mancante" }, { status: 401 });
    }

    const rotated = await rotateRefreshSession(rawRefreshToken);
    const user = await prisma.user.findUnique({ where: { id: rotated.userId } });

    if (!user || !isUserRole(user.role)) {
      return NextResponse.json({ error: "Utente non valido" }, { status: 401 });
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

    const response = NextResponse.json({ user: safeUser });
    response.cookies.set(AUTH_TOKEN_COOKIE, accessToken, getCookieConfig(ACCESS_TOKEN_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, rotated.refreshToken, getCookieConfig(REFRESH_TOKEN_MAX_AGE));

    return response;
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
