import { currentTimeZone } from "@/lib/auth/context";

export function currentDay(timeZone: string = currentTimeZone()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
}

export function currentClock(timeZone: string = currentTimeZone(), at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}

export function describeNow(timeZone: string = currentTimeZone()): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

export function offsetFor(timeZone: string, at: Date): string {
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
    .formatToParts(at)
    .find((item) => item.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-]\d{2}):?(\d{2})?/.exec(part);
  if (!match) {
    return "+00:00";
  }
  return `${match[1]}:${match[2] ?? "00"}`;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}
