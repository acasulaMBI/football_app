import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertRosterAccess, getAuthErrorMessage, requireWriteUser } from "@/lib/auth";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const user = await requireWriteUser(_request);
    const { id, eventId } = await params;

    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      select: { id: true, matchId: true, match: { select: { rosterId: true } } },
    });

    if (!event || event.matchId !== id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await assertRosterAccess(user, event.match.rosterId);

    await prisma.matchEvent.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    if (authError.status !== 500) {
      return NextResponse.json({ error: authError.message }, { status: authError.status });
    }

    console.error("Error deleting match event:", error);
    return NextResponse.json({ error: "Failed to delete match event" }, { status: 500 });
  }
}
