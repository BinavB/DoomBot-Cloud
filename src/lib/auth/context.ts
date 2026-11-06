import { AsyncLocalStorage } from "node:async_hooks";
import { config } from "@/lib/config";
import { AgentError } from "@/lib/errors";

interface UserContext {
  userId: number;
  timeZone: string;
}

const globalForContext = globalThis as unknown as {
  doombotUserContext?: AsyncLocalStorage<UserContext>;
};

const storage = (globalForContext.doombotUserContext ??= new AsyncLocalStorage<UserContext>());

export function runAsUser<T>(userId: number, timeZone: string, work: () => T): T {
  return storage.run({ userId, timeZone }, work);
}

export function currentUserId(): number {
  return currentContext().userId;
}

export function currentTimeZone(): string {
  return storage.getStore()?.timeZone ?? config.timezone;
}

function currentContext(): UserContext {
  const context = storage.getStore();
  if (context === undefined) {
    throw new AgentError("Sign in to use DOOMBOT.");
  }
  return context;
}
