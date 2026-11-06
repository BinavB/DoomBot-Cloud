import { runAsUser } from "@/lib/auth/context";
import { listActiveUserIds } from "@/lib/auth/users";
import { startTask } from "@/lib/bots/run";
import { listRoutineBots, markRoutineRan } from "@/lib/bots/store";
import { routinePeriod } from "@/lib/bots/schedule";
import { generateBriefing, findBriefing } from "@/lib/briefing/generate";
import { config } from "@/lib/config";
import { currentClock, currentDay } from "@/lib/time";

const tickMilliseconds = 60000;

const globalForScheduler = globalThis as unknown as {
  doombotSchedulerStarted?: boolean;
  doombotBriefingRunning?: boolean;
  doombotRoutinesRunning?: boolean;
};

async function briefUser(userId: number): Promise<void> {
  await runAsUser(userId, async () => {
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

export async function runBriefingsIfDue(): Promise<void> {
  if (globalForScheduler.doombotBriefingRunning || currentClock() < config.briefingTime) {
    return;
  }
  globalForScheduler.doombotBriefingRunning = true;
  try {
    for (const userId of await listActiveUserIds()) {
      await briefUser(userId);
    }
  } finally {
    globalForScheduler.doombotBriefingRunning = false;
  }
}

export async function runDueRoutines(at: Date): Promise<void> {
  if (globalForScheduler.doombotRoutinesRunning) {
    return;
  }
  globalForScheduler.doombotRoutinesRunning = true;
  try {
    for (const bot of await listRoutineBots()) {
      const routine = bot.routine;
      if (!routine) {
        continue;
      }
      const period = routinePeriod(routine, at);
      if (period === null || period === routine.lastRun) {
        continue;
      }
      await markRoutineRan(bot.id, period);
      const started = await runAsUser(bot.userId, () => startTask(bot, routine.instruction, "routine"));
      started.completion.catch((error: unknown) => {
        console.error(`Routine for ${bot.name} failed:`, error);
      });
    }
  } finally {
    globalForScheduler.doombotRoutinesRunning = false;
  }
}

export async function runScheduledWork(): Promise<void> {
  await Promise.all([
    runBriefingsIfDue().catch((error: unknown) => {
      console.error("Morning briefings failed:", error);
    }),
    runDueRoutines(new Date()).catch((error: unknown) => {
      console.error("Doombot routines failed:", error);
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
