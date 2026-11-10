import { describe, expect, it } from "vitest";
import { runAsUser } from "@/lib/auth/context";
import { delegationSpecs } from "@/lib/bots/delegation";
import { assistantNameGuide, assistantNames, defaultBotName, defaultBotSlug } from "@/lib/bots/names";
import { createBot, listBots } from "@/lib/bots/store";
import { runStatement } from "@/lib/database";

const zone = "Asia/Dubai";

describe("assistant names", () => {
  it("lists the Marvel and Doom names with a strength each", () => {
    const names = assistantNames.map((item) => item.name);
    expect(names).toEqual(expect.arrayContaining(["Jarvis", "Edith", "Friday", "Baymax", "DOOM-01", "DOOMBOT PRIME", "VICTOR", "LATVERIA"]));
    expect(new Set(names).size).toBe(names.length);
    expect(assistantNames.every((item) => item.strength.length > 0)).toBe(true);
    expect(assistantNameGuide()).toContain("Jarvis (");
  });

  it("does not offer the default bot's own name as a substitute", () => {
    expect(assistantNames.map((item) => item.name)).not.toContain(defaultBotName);
  });
});

describe("default bot", () => {
  it("gives a new account only DOOM PRIME as the built-in bot", async () => {
    const bots = await runAsUser(61, zone, () => listBots());
    expect(bots.map((bot) => bot.name)).toEqual([defaultBotName]);
    expect(bots[0].builtIn).toBe(true);
    expect(bots[0].slug).toBe(defaultBotSlug);
  });

  it("turns the old calendar and email helpers into substitute bots", async () => {
    await runStatement(
      "INSERT INTO bots (user_id, slug, name, instructions, tool_names, built_in) VALUES (62, 'calendar', 'Doombot Chronos', 'old calendar text here', '[]', 1), (62, 'email', 'Doombot Herald', 'old email text here', '[]', 1)",
    );
    const bots = await runAsUser(62, zone, () => listBots());
    const byName = new Map(bots.map((bot) => [bot.name, bot]));
    expect(byName.get("Friday")?.builtIn).toBe(false);
    expect(byName.get("Edith")?.builtIn).toBe(false);
    expect(bots.filter((bot) => bot.builtIn).map((bot) => bot.name)).toEqual([defaultBotName]);
  });

  it("does not let the chief hand work to itself", async () => {
    await runAsUser(63, zone, () =>
      createBot({ name: "Jarvis", instructions: "You manage systems and help with technical tasks.", toolNames: [], routine: null, look: {} }),
    );
    const specs = await runAsUser(63, zone, () => delegationSpecs());
    const names = specs.map((spec) => spec.function.name);
    expect(names).toContain("ask_jarvis_agent");
    expect(names).not.toContain(`ask_${defaultBotSlug}_agent`);
  });
});
