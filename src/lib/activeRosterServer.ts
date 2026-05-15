import { cookies } from "next/headers";
import { ACTIVE_ROSTER_COOKIE } from "@/lib/activeRoster";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/authServer";

export async function getActiveRosterIdFromCookies() {
  const cookieStore = await cookies();
  const rosterId = cookieStore.get(ACTIVE_ROSTER_COOKIE)?.value;

  if (!rosterId) {
    return null;
  }

  const user = await getCurrentUserFromCookies();
  if (!user) {
    return null;
  }

  const roster = await prisma.roster.findUnique({
    where: { id: rosterId },
    select: { ownerId: true },
  });

  if (!roster) {
    return null;
  }

  if (user.role === "ADMIN") {
    return rosterId;
  }

  if (!roster.ownerId || roster.ownerId === user.id) {
    return rosterId;
  }

  return null;
}
