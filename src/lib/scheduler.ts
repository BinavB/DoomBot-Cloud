import { runAsUser } from "@/lib/auth/context";
import { removeStaleGuests } from "@/lib/auth/guest";
import { listActiveUsers } from "@/lib/auth/users";
import { startTask } from "@/lib/bots/run";
import { listRoutineBots, markRoutineRan } from "@/lib/bots/store";
import { routinePeriod } from "@/lib/bots/schedule";
import { generateBriefing, findBriefing } from "@/lib/briefing/generate";
import { sendCheckinIfDue } from "@/lib/checkins";
import { alertNewEmails } from "@/lib/mail-watch";
import { config } from "@/lib/config";
import { currentClock, currentDay } from "@/lib/time";

const tickMilliseconds = 60000;

const globalForScheduler = globalThis as unknown as {
  doombotSchedulerStarted?: boolean;
  doombotBriefingRunning?: boolean;
  doombotRoutinesRunning?: boolean;
  doombotCheckinsRunning?: boolean;
  doombotMailRunning?: boolean;
};

async function briefUser(userId: number, timeZone: string, at: Date): Promise<void> {
  if (currentClock(timeZone, at) < config.briefingTime) {
    return;
  }
  await runAsUser(userId, timeZone, async () => {
    if (await findBriefing(currentDay())) {
      return;
    }
    try {
      await generateBriefing();
    } catch (error) {
      console.error(`Morning briefing failed for user ${userId}:`, error);
    }
  });
}

export async function runBriefingsIfDue(at: Date = new Date()): Promise<void> {
  if (globalForScheduler.doombotBriefingRunning) {
    return;
  }
  globalForScheduler.doombotBriefingRunning = true;
  try {
    for (const user of await listActiveUsers()) {
      await briefUser(user.id, user.timeZone, at);
    }
  } finally {
    globalForScheduler.doombotBriefingRunning = false;
  }
}

export async function runCheckinsIfDue(at: Date = new Date()): Promise<void> {
  if (globalForScheduler.doombotCheckinsRunning) {
    return;
  }
  globalForScheduler.doombotCheckinsRunning = true;
  try {
    for (const user of await listActiveUsers()) {
      await runAsUser(user.id, user.timeZone, () => sendCheckinIfDue(user.timeZone, at)).catch((error: unknown) => {
        console.error(`Check-in failed for user ${user.id}:`, error);
      });
    }
  } finally {
    globalForScheduler.doombotCheckinsRunning = false;
  }
}

export async function runMailWatchIfDue(): Promise<void> {
  if (globalForScheduler.doombotMailRunning) {
    return;
  }
  globalForScheduler.doombotMailRunning = true;
  try {
    for (const user of await listActiveUsers()) {
      await runAsUser(user.id, user.timeZone, () => alertNewEmails()).catch((error: unknown) => {
        console.error(`New-mail check failed for user ${user.id}:`, error);
      });
    }
  } finally {
    globalForScheduler.doombotMailRunning = false;
  }
}

export async function runDueRoutines(at: Date = new Date()): Promise<void> {
  if (globalForScheduler.doombotRoutinesRunning) {
    return;
  }
  globalForScheduler.doombotRoutinesRunning = true;
  try {
    const zones = new Map((await listActiveUsers()).map((user) => [user.id, user.timeZone]));
    for (const bot of await listRoutineBots()) {
      const routine = bot.routine;
      const timeZone = zones.get(bot.userId) ?? config.timezone;
      if (!routine) {
        continue;
      }
      const period = routinePeriod(routine, at, timeZone);
      if (period === null || period === routine.lastRun) {
        continue;
      }
      await markRoutineRan(bot.id, period);
      const started = await runAsUser(bot.userId, timeZone, () => startTask(bot, routine.instruction, "routine"));
      started.completion.catch((error: unknown) => {
        console.error(`Routine for ${bot.name} failed:`, error);
      });
    }
  } finally {
    globalForScheduler.doombotRoutinesRunning = false;
  }
}

export async function runScheduledWork(): Promise<void> {
  const at = new Date();
  await Promise.all([
    runBriefingsIfDue(at).catch((error: unknown) => {
      console.error("Morning briefings failed:", error);
    }),
    runDueRoutines(at).catch((error: unknown) => {
      console.error("Doombot routines failed:", error);
    }),
    runCheckinsIfDue(at).catch((error: unknown) => {
      console.error("Check-ins failed:", error);
    }),
    runMailWatchIfDue().catch((error: unknown) => {
      console.error("New-mail check failed:", error);
    }),
    removeStaleGuests().catch((error: unknown) => {
      console.error("Guest cleanup failed:", error);
    }),
  ]);
}

export function startScheduler(): void {
  if (globalForScheduler.doombotSchedulerStarted) {
    return;
  }
  globalForScheduler.doombotSchedulerStarted = true;
  setInterval(() => {
    void runScheduledWork();
  }, tickMilliseconds);
}
