import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from "node:crypto";
import { AgentError } from "@/lib/errors";

const prefix = "enc:v1:";
const minimumSecretLength = 32;

function key(): Buffer {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < minimumSecretLength) {
    throw new AgentError("AUTH_SECRET must be set to at least 32 characters.");
  }
  return Buffer.from(hkdfSync("sha256", secret, "doombot", "stored-secrets", 32));
}

export function sealSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${prefix}${[iv, cipher.getAuthTag(), body].map((part) => part.toString("base64url")).join(".")}`;
}

export function openSecret(stored: string): string | null {
  if (!stored.startsWith(prefix)) {
    return stored;
  }
  try {
    const [iv, tag, body] = stored.slice(prefix.length).split(".").map((part) => Buffer.from(part, "base64url"));
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
