export interface Dated {
  updatedAt: string;
}

export interface ConversationGroup<T extends Dated> {
  label: string;
  items: T[];
}

const dayMilliseconds = 24 * 60 * 60 * 1000;

function startOfLocalDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parseStored(updatedAt: string): Date {
  return new Date(`${updatedAt.replace(" ", "T")}Z`);
}

export function groupByDate<T extends Dated>(items: T[], now: Date = new Date()): ConversationGroup<T>[] {
  const today = startOfLocalDay(now);
  const buckets: ConversationGroup<T>[] = [
    { label: "Today", items: [] },
    { label: "Yesterday", items: [] },
    { label: "Previous 7 days", items: [] },
    { label: "Previous 30 days", items: [] },
    { label: "Older", items: [] },
  ];
  for (const item of items) {
    const age = Math.round((today - startOfLocalDay(parseStored(item.updatedAt))) / dayMilliseconds);
    const index = age <= 0 ? 0 : age === 1 ? 1 : age <= 7 ? 2 : age <= 30 ? 3 : 4;
    buckets[index].items.push(item);
  }
  return buckets.filter((bucket) => bucket.items.length > 0);
}
