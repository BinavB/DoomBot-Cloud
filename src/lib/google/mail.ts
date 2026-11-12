import { AgentError } from "@/lib/errors";

export const maxRecipientLength = 254;
export const maxSubjectLength = 200;
export const maxMailBodyLength = 10000;

const recipientPattern = /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]+$/;

export interface OutgoingMail {
  to: string;
  subject: string;
  body: string;
}

function readMailField(value: unknown, label: string, maxLength: number): string {
  if (typeof value !== "string") {
    throw new AgentError(`"${label}" must be text.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) {
    throw new AgentError(`"${label}" must be 1 to ${maxLength} characters.`);
  }
  if (/[\r\n]/.test(trimmed) && label !== "body") {
    throw new AgentError(`"${label}" must be one line.`);
  }
  return trimmed;
}

export function readOutgoingMail(args: Record<string, unknown>): OutgoingMail {
  const to = readMailField(args.to, "to", maxRecipientLength);
  if (!recipientPattern.test(to)) {
    throw new AgentError('"to" must be one email address.');
  }
  return {
    to,
    subject: readMailField(args.subject, "subject", maxSubjectLength),
    body: readMailField(args.body, "body", maxMailBodyLength),
  };
}

export function buildRawEmail(mail: OutgoingMail): string {
  const lines = [
    `To: ${mail.to}`,
    `Subject: ${encodeHeaderValue(mail.subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    mail.body,
  ];
  return Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
}

function encodeHeaderValue(value: string): string {
  if (/^[\x20-\x7e]*$/.test(value)) {
    return value;
  }
  return `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}
