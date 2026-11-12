import { describe, expect, it } from "vitest";
import { buildRawEmail, readOutgoingMail } from "@/lib/google/mail";

describe("outgoing mail", () => {
  it("accepts one recipient, a subject and a body", () => {
    expect(readOutgoingMail({ to: " ana@example.com ", subject: "Hi", body: "Line one\nLine two" })).toEqual({
      to: "ana@example.com",
      subject: "Hi",
      body: "Line one\nLine two",
    });
  });

  it("rejects a recipient list or a malformed address", () => {
    expect(() => readOutgoingMail({ to: "a@x.com, b@x.com", subject: "Hi", body: "Text" })).toThrow(
      '"to" must be one email address.',
    );
    expect(() => readOutgoingMail({ to: "not-an-address", subject: "Hi", body: "Text" })).toThrow(
      '"to" must be one email address.',
    );
  });

  it("rejects a subject that tries to add a header", () => {
    expect(() => readOutgoingMail({ to: "a@x.com", subject: "Hi\r\nBcc: b@x.com", body: "Text" })).toThrow(
      '"subject" must be one line.',
    );
  });

  it("rejects empty or missing fields", () => {
    expect(() => readOutgoingMail({ to: "a@x.com", subject: "  ", body: "Text" })).toThrow();
    expect(() => readOutgoingMail({ to: "a@x.com", subject: "Hi" })).toThrow('"body" must be text.');
  });
});

describe("raw email", () => {
  it("encodes headers and body as base64url", () => {
    const raw = buildRawEmail({ to: "ana@example.com", subject: "Hello", body: "Body text" });
    const decoded = Buffer.from(raw, "base64url").toString("utf8");
    expect(decoded).toContain("To: ana@example.com\r\n");
    expect(decoded).toContain("Subject: Hello\r\n");
    expect(decoded.endsWith("\r\n\r\nBody text")).toBe(true);
  });

  it("encodes a non-ASCII subject as a UTF-8 header word", () => {
    const decoded = Buffer.from(
      buildRawEmail({ to: "ana@example.com", subject: "Café", body: "x" }),
      "base64url",
    ).toString("utf8");
    expect(decoded).toContain(`Subject: =?UTF-8?B?${Buffer.from("Café", "utf8").toString("base64")}?=`);
  });
});
