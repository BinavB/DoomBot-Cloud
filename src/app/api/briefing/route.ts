import { NextResponse } from "next/server";
import { findBriefing, generateBriefing } from "@/lib/briefing/generate";
import { AgentError } from "@/lib/errors";
import { getBriefingTopics } from "@/lib/settings";
import { currentDay } from "@/lib/time";
import { withUser } from "@/lib/auth/route";

export const GET = withUser(async () => {
  const [briefing, topics] = await Promise.all([findBriefing(currentDay()), getBriefingTopics()]);
  return NextResponse.json({ briefing, topics });
});

export const POST = withUser(async () => {
  try {
    const briefing = await generateBriefing();
    return NextResponse.json({ briefing });
  } catch (error) {
    const message = error instanceof AgentError ? error.message : "Briefing could not be created.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
});
