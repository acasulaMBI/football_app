import { NextResponse } from "next/server";
import {
  AUTH_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAuthErrorMessage,
  revokeRefreshSession,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie") || "";
    const refreshPair = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${REFRESH_TOKEN_COOKIE}=`));

    if (refreshPair) {
      const refreshToken = decodeURIComponent(refreshPair.split("=").slice(1).join("="));
      if (refreshToken) {
        await revokeRefreshSession(refreshToken);
      }
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    response.cookies.set(REFRESH_TOKEN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });

    return response;
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
