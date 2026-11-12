import { describe, expect, it } from "vitest";
import { readOutgoingMail } from "@/lib/google/mail";
import { findSensitiveData } from "@/lib/sensitive-data";
import { isToolPolicy } from "@/lib/agent/policies";

describe("private data check", () => {
  it("finds a card number that passes the Luhn check", () => {
    expect(findSensitiveData("My card is 4111 1111 1111 1111, thanks.")).toBe("card number");
  });

  it("ignores digit strings that fail the Luhn check", () => {
    expect(findSensitiveData("Order 1111 1111 1111 1112 is ready.")).toBeNull();
  });

  it("finds a bank account number", () => {
    expect(findSensitiveData("Pay to GB29 NWBK 6016 1331 9268 19 please.")).toBe("bank account number");
  });

  it("passes ordinary text", () => {
    expect(findSensitiveData("Meeting moved to Thursday at 10:00.")).toBeNull();
  });

  it("stops an email that contains a card number before it is sent", () => {
    expect(() =>
      readOutgoingMail({ to: "ana@example.com", subject: "Card", body: "Use 4111 1111 1111 1111." }),
    ).toThrow("Not sent: the email seems to contain a card number.");
  });
});

describe("tool policies", () => {
  it("accepts only ask, always and off", () => {
    expect(isToolPolicy("ask")).toBe(true);
    expect(isToolPolicy("always")).toBe(true);
    expect(isToolPolicy("off")).toBe(true);
    expect(isToolPolicy("sometimes")).toBe(false);
    expect(isToolPolicy(undefined)).toBe(false);
  });
});
