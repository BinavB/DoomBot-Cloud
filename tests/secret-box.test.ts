import { describe, expect, it } from "vitest";
import { openSecret, sealSecret } from "@/lib/secret-box";

describe("secret box", () => {
  it("round-trips a secret and hides it", () => {
    const sealed = sealSecret("refresh-token-123");
    expect(sealed.startsWith("enc:v1:")).toBe(true);
    expect(sealed).not.toContain("refresh-token-123");
    expect(openSecret(sealed)).toBe("refresh-token-123");
  });

  it("gives a different ciphertext each time", () => {
    expect(sealSecret("same")).not.toBe(sealSecret("same"));
  });

  it("returns legacy plain values unchanged", () => {
    expect(openSecret("plain-old-token")).toBe("plain-old-token");
  });

  it("rejects tampered data", () => {
    const sealed = sealSecret("secret");
    const tampered = `${sealed.slice(0, -2)}AA`;
    expect(openSecret(tampered)).toBeNull();
  });
});
