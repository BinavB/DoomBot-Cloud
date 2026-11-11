const secondsInMilliseconds = 1000;
const hourInMilliseconds = 60 * 60 * secondsInMilliseconds;

const providerCooldowns = new Map<string, number>();
const modelCooldowns = new Map<string, number>();
const requesterCooldowns = new Map<string, number>();

function sharedCooldownFor(status: number | undefined): number | undefined {
  if (status === 404) {
    return hourInMilliseconds;
  }
  if (status === 429) {
    return 60 * secondsInMilliseconds;
  }
  if (status !== undefined && status >= 500) {
    return 30 * secondsInMilliseconds;
  }
  return undefined;
}

function requesterKey(requester: string, provider: string, model: string): string {
  return `${requester}|${provider}/${model}`;
}

export function markFailed(
  provider: string,
  model: string,
  status: number | undefined,
  requester: string | undefined,
  now = Date.now(),
): void {
  if (status === 401 || status === 402) {
    providerCooldowns.set(provider, now + hourInMilliseconds);
    return;
  }
  const shared = sharedCooldownFor(status);
  if (shared !== undefined) {
    modelCooldowns.set(`${provider}/${model}`, now + shared);
    return;
  }
  if (requester !== undefined) {
    requesterCooldowns.set(requesterKey(requester, provider, model), now + 120 * secondsInMilliseconds);
  }
}

export function isCoolingDown(provider: string, model: string, requester: string | undefined, now = Date.now()): boolean {
  const until = [
    providerCooldowns.get(provider) ?? 0,
    modelCooldowns.get(`${provider}/${model}`) ?? 0,
    requester !== undefined ? (requesterCooldowns.get(requesterKey(requester, provider, model)) ?? 0) : 0,
  ];
  return until.some((time) => time > now);
}

export function resetProviderHealth(): void {
  providerCooldowns.clear();
  modelCooldowns.clear();
  requesterCooldowns.clear();
}
