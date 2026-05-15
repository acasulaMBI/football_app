import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { isUserRole, type UserRole } from "@/lib/userRoles";

export const AUTH_TOKEN_COOKIE = "authToken";
export const REFRESH_TOKEN_COOKIE = "refreshToken";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const REFRESH_TOKEN_TTL_DAYS = 14;
const DEV_FALLBACK_JWT_SECRET = "dev-only-jwt-secret-change-me";

function getJwtSecret(): string {
  const configuredSecret = process.env.JWT_SECRET;
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV !== "production") {
    return DEV_FALLBACK_JWT_SECRET;
  }

  throw new AuthError("Configurazione mancante: JWT_SECRET", 500);
}

function getJwtSecretBytes(): Uint8Array {
  return new TextEncoder().encode(getJwtSecret());
}

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
};

type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  username: string;
  email?: string | null;
};

class AuthError extends Error {
  status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export function getAuthErrorMessage(error: unknown): { status: number; message: string } {
  if (error instanceof AuthError) {
    return { status: error.status, message: error.message };
  }

  return { status: 500, message: "Errore interno durante autenticazione" };
}

export function createPasswordHash(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export async function signAccessToken(user: AuthenticatedUser): Promise<string> {
  const jwtSecretBytes = getJwtSecretBytes();
  return new SignJWT({ role: user.role, username: user.username, email: user.email } as AccessTokenPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(jwtSecretBytes);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  try {
    const jwtSecretBytes = getJwtSecretBytes();
    const { payload } = await jwtVerify(token, jwtSecretBytes);
    const sub = payload.sub;
    const role = payload.role;
    const username = payload.username;
    const email = payload.email;

    if (!sub || typeof sub !== "string") {
      throw new AuthError("Token non valido", 401);
    }

    if (typeof role !== "string" || !isUserRole(role)) {
      throw new AuthError("Ruolo token non valido", 401);
    }

    if (typeof username !== "string") {
      throw new AuthError("Token non valido", 401);
    }

    if (typeof email !== "string") {
      if (email !== null && email !== undefined) {
        throw new AuthError("Token non valido", 401);
      }
    }

    return { sub, role, username, email: email ?? null };
  } catch {
    throw new AuthError("Sessione non valida o scaduta", 401);
  }
}

export function extractBearerToken(request: Request | NextRequest): string | null {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!authHeader) return null;
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice("Bearer ".length).trim() || null;
}

async function getCookieTokenFromRequest(request: Request | NextRequest): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const pairs = cookieHeader.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    const [key, ...rest] = pair.split("=");
    if (key === AUTH_TOKEN_COOKIE) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

export async function requireAuthenticatedUser(request: Request | NextRequest): Promise<AuthenticatedUser> {
  const token = extractBearerToken(request) || (await getCookieTokenFromRequest(request));
  if (!token) {
    throw new AuthError("Autenticazione richiesta", 401);
  }

  const payload = await verifyAccessToken(token);
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  if (!user || !isUserRole(user.role)) {
    throw new AuthError("Utente non trovato", 401);
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export async function requireWriteUser(request: Request | NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(request);
  if (user.role !== "ADMIN" && user.role !== "EDITOR") {
    throw new AuthError("Permessi insufficienti", 403);
  }

  return user;
}

export async function requireAdminUser(request: Request | NextRequest): Promise<AuthenticatedUser> {
  const user = await requireAuthenticatedUser(request);
  if (user.role !== "ADMIN") {
    throw new AuthError("Permessi amministratore richiesti", 403);
  }

  return user;
}

export async function assertRosterAccess(user: AuthenticatedUser, rosterId: string): Promise<void> {
  const roster = await prisma.roster.findUnique({
    where: { id: rosterId },
    select: { id: true, ownerId: true },
  });

  if (!roster) {
    throw new AuthError("Rosa non trovata", 404);
  }

  if (user.role === "ADMIN") {
    return;
  }

  if (!roster.ownerId) {
    return;
  }

  if (roster.ownerId !== user.id) {
    throw new AuthError("Accesso negato a questa rosa", 403);
  }
}

export async function resolveRequestedRosterId(
  request: Request | NextRequest,
  fallbackRosterId: string | null
): Promise<string | null> {
  const url = new URL(request.url);
  const queryRosterId = url.searchParams.get("rosterId");
  if (queryRosterId) {
    return queryRosterId;
  }

  if (fallbackRosterId) {
    return fallbackRosterId;
  }

  const cookieStore = await cookies();
  return cookieStore.get("activeRosterId")?.value || null;
}

export async function createRefreshSession(userId: string): Promise<string> {
  const rawToken = randomBytes(48).toString("base64url");
  const refreshTokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      userId,
      refreshTokenHash,
      expiresAt,
    },
  });

  return rawToken;
}

export async function rotateRefreshSession(rawToken: string): Promise<{ userId: string; refreshToken: string }> {
  const refreshTokenHash = sha256(rawToken);

  const current = await prisma.session.findFirst({
    where: {
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!current) {
    throw new AuthError("Refresh token non valido", 401);
  }

  await prisma.session.update({ where: { id: current.id }, data: { revokedAt: new Date() } });
  const nextRefresh = await createRefreshSession(current.userId);

  return { userId: current.userId, refreshToken: nextRefresh };
}

export async function revokeRefreshSession(rawToken: string): Promise<void> {
  const refreshTokenHash = sha256(rawToken);

  await prisma.session.updateMany({
    where: { refreshTokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

function shouldUseSecureCookies(): boolean {
  const secureOverride = process.env.AUTH_COOKIE_SECURE;
  if (secureOverride === "true") {
    return true;
  }

  if (secureOverride === "false") {
    return false;
  }

  if (process.env.NODE_ENV !== "production") {
    return false;
  }

  const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  return appUrl.startsWith("https://");
}

export function getCookieConfig(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export const ACCESS_TOKEN_MAX_AGE = ACCESS_TOKEN_TTL_SECONDS;
export const REFRESH_TOKEN_MAX_AGE = REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60;
