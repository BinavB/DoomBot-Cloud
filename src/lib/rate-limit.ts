const windowMilliseconds = 60_000;
const maxRequestsPerWindow = 20;

const globalForRateLimit = globalThis as unknown as { doombotRequests?: Map<number, number[]> };
const requests = (globalForRateLimit.doombotRequests ??= new Map<number, number[]>());

export function takeChatSlot(userId: number, now: number = Date.now()): boolean {
  const recent = (requests.get(userId) ?? []).filter((time) => now - time < windowMilliseconds);
  if (recent.length >= maxRequestsPerWindow) {
    requests.set(userId, recent);
    return false;
  }
  recent.push(now);
  requests.set(userId, recent);
  return true;
}
