import { cookies } from "next/headers";
import { ACTIVE_ROSTER_COOKIE } from "@/lib/activeRoster";

export async function getActiveRosterIdFromCookies() {
  const cookieStore = await cookies();
  const rosterId = cookieStore.get(ACTIVE_ROSTER_COOKIE)?.value;
  return rosterId || null;
}
