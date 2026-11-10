import { describe, expect, it } from "vitest";
import { botAllowedToolInfos } from "@/lib/agent/tools";
import { humanize, toolHelp, toolLabel } from "@/lib/bots/tool-labels";

describe("tool labels", () => {
  it("shows plain words with no underscores for every tool a Doombot can use", () => {
    for (const tool of botAllowedToolInfos()) {
      const label = toolLabel(tool.name);
      expect(label).not.toContain("_");
      expect(toolHelp(tool.name, tool.description)).not.toMatch(/list_|add_|update_|todo_id/);
    }
  });

  it("turns unknown names into readable words", () => {
    expect(humanize("send_weekly_digest")).toBe("Send weekly digest");
    expect(toolLabel("some_new_tool")).toBe("Some new tool");
  });

  it("keeps the given description for unknown tools", () => {
    expect(toolHelp("some_new_tool", "Does a thing.")).toBe("Does a thing.");
  });
});
