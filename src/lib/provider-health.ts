const secondsInMilliseconds = 1000;
const hourInMilliseconds = 60 * 60 * secondsInMilliseconds;

const modelCooldowns = new Map<string, number>();
const providerCooldowns = new Map<string, number>();

function cooldownFor(status: number | undefined): number {
  if (status === 404) {
    return hourInMilliseconds;
  }
  if (status === 400) {
    return 120 * secondsInMilliseconds;
  }
  if (status === 429) {
    return 60 * secondsInMilliseconds;
  }
  return 30 * secondsInMilliseconds;
}

export function markFailed(provider: string, model: string, status: number | undefined, now = Date.now()): void {
  if (status !== undefined && [401, 402, 403].includes(status)) {
    providerCooldowns.set(provider, now + hourInMilliseconds);
    return;
  }
  modelCooldowns.set(`${provider}/${model}`, now + cooldownFor(status));
}

export function isCoolingDown(provider: string, model: string, now = Date.now()): boolean {
  const providerUntil = providerCooldowns.get(provider) ?? 0;
  const modelUntil = modelCooldowns.get(`${provider}/${model}`) ?? 0;
  return providerUntil > now || modelUntil > now;
}

export function resetProviderHealth(): void {
  modelCooldowns.clear();
  providerCooldowns.clear();
}
