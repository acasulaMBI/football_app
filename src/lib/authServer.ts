import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_TOKEN_COOKIE, verifyAccessToken } from "@/lib/auth";
import { isUserRole, canWrite, isAdmin } from "@/lib/userRoles";

export async function getCurrentUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  if (!token) {
    return null;
  }

  try {
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
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUserPermissions() {
  const user = await getCurrentUserFromCookies();
  if (!user) {
    return {
      user: null,
      canWrite: false,
      isAdmin: false,
    };
  }

  return {
    user,
    canWrite: canWrite(user.role),
    isAdmin: isAdmin(user.role),
  };
}
