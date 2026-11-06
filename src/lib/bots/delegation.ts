import type { ToolSpec } from "@/lib/ai";
import { listBots, type Bot } from "@/lib/bots/store";

const descriptionLength = 140;

function delegationName(bot: Bot): string {
  return `ask_${bot.slug}_agent`;
}

export async function delegationSpecs(): Promise<ToolSpec[]> {
  return (await listBots()).map((bot) => ({
    type: "function",
    function: {
      name: delegationName(bot),
      description: `${bot.name}: ${bot.instructions.slice(0, descriptionLength)} Pass the full task in "question".`,
      parameters: {
        type: "object",
        properties: {
          question: { type: "string", description: "The task or question for this Doombot." },
        },
        required: ["question"],
      },
    },
  }));
}

export async function findBotForTool(toolName: string): Promise<Bot | undefined> {
  return (await listBots()).find((bot) => delegationName(bot) === toolName);
}
