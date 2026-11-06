import { connection, NextResponse } from "next/server";
import { isShareToken, readSharedChat } from "@/lib/sharing";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  const chat = isShareToken(token) ? await readSharedChat(token) : null;
  if (!chat) {
    return NextResponse.json({ error: "This shared chat is not available." }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json(chat, { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}
