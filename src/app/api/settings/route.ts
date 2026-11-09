import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { normalizeTopics } from "@/lib/briefing/topics";
import { findPlace } from "@/lib/geocode";
import { readBody } from "@/lib/http";
import {
  clearHomeLocation,
  getBriefingTopics,
  getCustomInstructions,
  getHomeLocation,
  getTimeZone,
  listUserMemories,
  maxInstructionsLength,
  saveBriefingTopics,
  saveCustomInstructions,
  saveHomeLocation,
  saveTimeZone,
} from "@/lib/settings";

export const GET = withUser(async () => {
  const [customInstructions, timeZone, home, memories, briefingTopics] = await Promise.all([
    getCustomInstructions(),
    getTimeZone(),
    getHomeLocation(),
    listUserMemories(),
    getBriefingTopics(),
  ]);
  return NextResponse.json({ customInstructions, timeZone, homeCity: home?.city ?? "", memories, maxInstructionsLength, briefingTopics });
});

export const PUT = withUser(async (request: Request) => {
  const body = await readBody<{ customInstructions?: unknown; timeZone?: unknown; homeCity?: unknown; briefingTopics?: unknown }>(request);
  if (!body) {
    return NextResponse.json({ error: "Send the settings as JSON." }, { status: 400 });
  }
  if (typeof body.customInstructions === "string") {
    await saveCustomInstructions(body.customInstructions);
  }
  if (Array.isArray(body.briefingTopics)) {
    await saveBriefingTopics(normalizeTopics(body.briefingTopics));
  }
  if (typeof body.timeZone === "string" && !(await saveTimeZone(body.timeZone))) {
    return NextResponse.json({ error: "That time zone is not recognised." }, { status: 400 });
  }
  if (typeof body.homeCity === "string") {
    const query = body.homeCity.trim().slice(0, 80);
    if (query.length === 0) {
      await clearHomeLocation();
    } else {
      const place = await findPlace(query);
      if (!place) {
        return NextResponse.json({ error: "That city could not be found. Try a bigger city nearby." }, { status: 400 });
      }
      await saveHomeLocation(place);
    }
  }
  return NextResponse.json({ ok: true });
});
