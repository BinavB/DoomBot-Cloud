import { describe, expect, it } from "vitest";
import { maxSuggestionTitleLength, parseSuggestions } from "@/lib/suggestions";

describe("parsing suggestions", () => {
  it("reads a JSON array even when the model adds words around it", () => {
    const text = 'Here you go: [{"title": "Sort mail", "prompt": "Sort my unread mail."}] Thanks';
    expect(parseSuggestions(text)).toEqual([{ title: "Sort mail", prompt: "Sort my unread mail." }]);
  });

  it("returns nothing for an empty list or text without JSON", () => {
    expect(parseSuggestions("[]")).toEqual([]);
    expect(parseSuggestions("No ideas today.")).toEqual([]);
    expect(parseSuggestions("[not json]")).toEqual([]);
  });

  it("drops items with a missing title or prompt", () => {
    const text = '[{"title": "Only a title"}, {"prompt": "Only a prompt"}, {"title": "Full", "prompt": "Do it."}]';
    expect(parseSuggestions(text)).toEqual([{ title: "Full", prompt: "Do it." }]);
  });

  it("keeps at most three suggestions and shortens long titles", () => {
    const long = "t".repeat(200);
    const items = Array.from({ length: 5 }, (_, index) => ({ title: `${long}${index}`, prompt: `Task ${index}` }));
    const parsed = parseSuggestions(JSON.stringify(items));
    expect(parsed).toHaveLength(3);
    expect(parsed[0].title.length).toBe(maxSuggestionTitleLength);
  });
});
