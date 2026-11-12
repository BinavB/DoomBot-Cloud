import { NextResponse } from "next/server";
import { readLook } from "@/lib/bots/look";
import { configuredProviderNames } from "@/lib/ai";
import { deleteBot, getBot, setBotProvider, updateBotProfile } from "@/lib/bots/store";
import { readProviderChoice } from "@/lib/model-providers";
import { normalizeBotName } from "@/lib/bots/validate";
import { withUser } from "@/lib/auth/route";

export const PATCH = withUser(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const bot = await getBot(Number((await params).id));
  if (!bot) {
    return NextResponse.json({ error: "That Doombot does not exist." }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const name = body.name === undefined ? undefined : normalizeBotName(body.name);
  if (name === null) {
    return NextResponse.json({ error: "Give the Doombot a name of 2 to 40 characters." }, { status: 400 });
  }

  if (body.provider !== undefined) {
    const provider = readProviderChoice(body.provider, configuredProviderNames());
    if (provider === undefined) {
      return NextResponse.json({ error: "Pick a model provider that is set up on this server." }, { status: 400 });
    }
    await setBotProvider(bot.id, provider);
  }

  return NextResponse.json({ bot: await updateBotProfile(bot.id, { name, look: readLook(body) }) });
});

export const DELETE = withUser(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const bot = await getBot(Number((await params).id));
  if (!bot) {
    return NextResponse.json({ error: "That Doombot does not exist." }, { status: 404 });
  }
  if (bot.builtIn) {
    return NextResponse.json({ error: "Built-in Doombots cannot be deleted." }, { status: 400 });
  }
  await deleteBot(bot.id);
  return NextResponse.json({ ok: true });
});
