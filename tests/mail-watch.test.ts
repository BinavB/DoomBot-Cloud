import { describe, expect, it } from "vitest";
import { maxMailAlertsPerCheck, newEmailsAfter } from "@/lib/mail-watch";

const email = (receivedAt: number, subject: string) => ({ from: "a@example.com", subject, snippet: "", receivedAt });

describe("new email alerts", () => {
  it("keeps only mail received after the last check, oldest first", () => {
    const emails = [email(300, "third"), email(100, "old"), email(200, "second")];
    expect(newEmailsAfter(emails, 150).map((item) => item.subject)).toEqual(["second", "third"]);
  });

  it("alerts for at most five emails per check", () => {
    const emails = Array.from({ length: 8 }, (_, index) => email(index + 1, `mail ${index}`));
    expect(newEmailsAfter(emails, 0)).toHaveLength(maxMailAlertsPerCheck);
  });
});
