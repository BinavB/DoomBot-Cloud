import { NextResponse } from "next/server";
import { botAllowedToolInfos } from "@/lib/agent/tools";
import { createBot, getAllBotActivity, listBots } from "@/lib/bots/store";
import { normalizeBotInput } from "@/lib/bots/validate";
import { AgentError } from "@/lib/errors";
import { withUser } from "@/lib/auth/route";

export const GET = withUser(async () => {
  const [bots, activity] = await Promise.all([listBots(), getAllBotActivity()]);
  const idle = { running: 0, total: 0, failed: 0, lastStatus: null, lastAt: null };
  return NextResponse.json({ bots: bots.map((bot) => ({ ...bot, activity: activity.get(bot.id) ?? idle })) });
});

export const POST = withUser(async (request: Request) => {
  const body = (await request.json()) as Record<string, unknown>;
  const input = normalizeBotInput(body, new Set(botAllowedToolInfos().map((tool) => tool.name)));
  if (typeof input === "string") {
    return NextResponse.json({ error: input }, { status: 400 });
  }

  try {
    return NextResponse.json({ bot: await createBot(input) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AgentError ? error.message : "The bot could not be created." },
      { status: 400 },
    );
  }
});
