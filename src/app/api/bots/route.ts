import { NextResponse } from "next/server";
import { botAllowedToolInfos } from "@/lib/agent/tools";
import { createBot, getBotActivity, listBots } from "@/lib/bots/store";
import { normalizeBotInput } from "@/lib/bots/validate";
import { withUser } from "@/lib/auth/route";

export const GET = withUser(async () => {
  const bots = await Promise.all(
    (await listBots()).map(async (bot) => ({ ...bot, activity: await getBotActivity(bot.id) })),
  );
  return NextResponse.json({ bots });
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
      { error: error instanceof Error ? error.message : "The bot could not be created." },
      { status: 400 },
    );
  }
});
