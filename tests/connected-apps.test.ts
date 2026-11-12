import { describe, expect, it } from "vitest";
import { driveSearchQuery, isDriveFileId } from "@/lib/google/drive";
import { blocksToText, isNotionId, notionObjectTitle } from "@/lib/notion";

describe("Google Drive", () => {
  it("escapes quotes and backslashes in a search", () => {
    expect(driveSearchQuery("O'Brien\\plan")).toBe("fullText contains 'O\\'Brien\\\\plan' and trashed = false");
  });

  it("accepts only Drive-style file ids", () => {
    expect(isDriveFileId("1AbC_dEfGhIjK-lMnOpQrStUv")).toBe(true);
    expect(isDriveFileId("../../etc/passwd")).toBe(false);
    expect(isDriveFileId("short")).toBe(false);
  });
});

describe("Notion", () => {
  it("accepts only Notion ids", () => {
    expect(isNotionId("0123456789abcdef0123456789abcdef")).toBe(true);
    expect(isNotionId("01234567-89ab-cdef-0123-456789abcdef")).toBe(true);
    expect(isNotionId("not-an-id")).toBe(false);
  });

  it("reads a page title from a database or page object", () => {
    expect(notionObjectTitle({ id: "1", object: "database", title: [{ plain_text: "Tasks" }] })).toBe("Tasks");
    expect(
      notionObjectTitle({
        id: "2",
        object: "page",
        properties: { Name: { type: "title", title: [{ plain_text: "Launch plan" }] } },
      }),
    ).toBe("Launch plan");
  });

  it("turns blocks into plain text lines and skips empty blocks", () => {
    const blocks = [
      { type: "heading_1", heading_1: { rich_text: [{ plain_text: "Goals" }] } },
      { type: "paragraph", paragraph: { rich_text: [] } },
      { type: "bulleted_list_item", bulleted_list_item: { rich_text: [{ plain_text: "Ship " }, { plain_text: "beta" }] } },
    ];
    expect(blocksToText(blocks)).toBe("Goals\nShip beta");
  });
});
