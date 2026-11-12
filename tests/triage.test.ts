import { describe, expect, it } from "vitest";
import { formatEmailsForTriage, maxPreviewLength } from "@/lib/google/triage";

describe("mail triage input", () => {
  it("says so when there is no unread mail", () => {
    expect(formatEmailsForTriage([])).toBe("No unread emails.");
  });

  it("numbers each email with sender, subject and preview inside a data block", () => {
    const text = formatEmailsForTriage([
      { from: "Ana <ana@example.com>", subject: "Invoice due", snippet: "Please pay by Friday." },
    ]);
    expect(text).toContain("<unread_emails>");
    expect(text).toContain("1. From Ana <ana@example.com> | Subject: Invoice due | Preview: Please pay by Friday.");
    expect(text).toContain("</unread_emails>");
  });

  it("flattens line breaks and shortens long previews", () => {
    const text = formatEmailsForTriage([
      { from: "x@example.com", subject: "Long", snippet: `Line one\n\nLine two ${"a".repeat(300)}` },
    ]);
    const preview = text.split("Preview: ")[1].split("\n")[0];
    expect(preview.startsWith("Line one Line two")).toBe(true);
    expect(preview.length).toBe(maxPreviewLength);
  });
});
