import { NextResponse } from "next/server";
import { getAuthErrorMessage, requireAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireAuthenticatedUser(request);
    return NextResponse.json({ user });
  } catch (error) {
    const authError = getAuthErrorMessage(error);
    return NextResponse.json({ error: authError.message }, { status: authError.status });
  }
}
