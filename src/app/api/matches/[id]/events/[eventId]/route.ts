import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; eventId: string }> }
) {
  try {
    const { id, eventId } = await params;

    const event = await prisma.matchEvent.findUnique({
      where: { id: eventId },
      select: { id: true, matchId: true },
    });

    if (!event || event.matchId !== id) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.matchEvent.delete({ where: { id: eventId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match event:", error);
    return NextResponse.json({ error: "Failed to delete match event" }, { status: 500 });
  }
}
