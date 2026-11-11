import { describe, expect, it } from "vitest";
import { formatWebResults, toWebResults } from "@/lib/search/tavily";

describe("web search results", () => {
  it("keeps title, link and snippet and strips markup", () => {
    const results = toWebResults({
      results: [
        { title: "<b>Rain</b> news", url: "https://example.com/a", content: "Heavy <b>rain</b>  today." },
        { title: "No link", content: "skipped" },
      ],
    });
    expect(results).toEqual([{ title: "Rain news", url: "https://example.com/a", snippet: "Heavy rain today." }]);
  });

  it("returns nothing when the response has no results", () => {
    expect(toWebResults({})).toEqual([]);
    expect(formatWebResults([])).toBe("No web results found.");
  });

  it("formats numbered results with their links", () => {
    expect(formatWebResults([{ title: "A", url: "https://a.test", snippet: "Note" }])).toBe("1. A (https://a.test)\nNote");
  });

  it("keeps at most five results", () => {
    const many = Array.from({ length: 8 }, (_, index) => ({ title: `T${index}`, url: `https://t.test/${index}` }));
    expect(toWebResults({ results: many })).toHaveLength(5);
  });
});
