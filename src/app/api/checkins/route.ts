import { NextResponse } from "next/server";
import { getCheckinSettings, readCheckinTimes, saveCheckinSettings } from "@/lib/checkins";
import { withUser } from "@/lib/auth/route";
import { AgentError } from "@/lib/errors";
import { readBody } from "@/lib/http";

export const GET = withUser(async () => {
  const settings = await getCheckinSettings();
  return NextResponse.json({ enabled: settings.enabled, times: settings.times });
});

export const PUT = withUser(async (request: Request) => {
  const body = await readBody<{ enabled?: unknown; times?: unknown }>(request);
  if (!body || (body.enabled !== undefined && typeof body.enabled !== "boolean")) {
    return NextResponse.json({ error: "Send enabled as true or false." }, { status: 400 });
  }
  try {
    await saveCheckinSettings({
      enabled: body.enabled,
      times: body.times === undefined ? undefined : readCheckinTimes(body.times),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AgentError ? error.message : "The check-ins could not be saved." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
});
