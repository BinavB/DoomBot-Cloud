import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { isRating, rateMessage } from "@/lib/feedback";
import { readBody } from "@/lib/http";

export const POST = withUser(async (request: Request) => {
  const body = await readBody<{ messageId?: unknown; rating?: unknown }>(request);
  if (!body || typeof body.messageId !== "number" || !Number.isInteger(body.messageId) || !isRating(body.rating)) {
    return NextResponse.json({ error: "Send a message id and a rating of -1, 0 or 1." }, { status: 400 });
  }
  if (!(await rateMessage(body.messageId, body.rating))) {
    return NextResponse.json({ error: "That reply does not exist." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
});
