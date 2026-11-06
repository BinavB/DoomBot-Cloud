import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { readBody } from "@/lib/http";
import {
  getCustomInstructions,
  getTimeZone,
  listUserMemories,
  maxInstructionsLength,
  saveCustomInstructions,
  saveTimeZone,
} from "@/lib/settings";

export const GET = withUser(async () =>
  NextResponse.json({
    customInstructions: await getCustomInstructions(),
    timeZone: await getTimeZone(),
    memories: await listUserMemories(),
    maxInstructionsLength,
  }),
);

export const PUT = withUser(async (request: Request) => {
  const body = await readBody<{ customInstructions?: unknown; timeZone?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: "Send the settings as JSON." }, { status: 400 });
  }
  if (typeof body.customInstructions === "string") {
    await saveCustomInstructions(body.customInstructions);
  }
  if (typeof body.timeZone === "string" && !(await saveTimeZone(body.timeZone))) {
    return NextResponse.json({ error: "That time zone is not recognised." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
});
