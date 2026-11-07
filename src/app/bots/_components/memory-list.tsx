import type { BotMemory } from "@/lib/bots/client";

interface MemoryListProps {
  botName: string;
  memories: BotMemory[];
  onForget: (memoryId: number) => void;
}

export function MemoryList({ botName, memories, onForget }: MemoryListProps) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-6">
      <h3 className="font-display text-base font-semibold">Private memory</h3>
      <p className="text-sm text-muted">
        Only {botName} can see these facts. No other Doombot shares them.
      </p>
      {memories.length === 0 ? (
        <p className="text-sm text-muted">
          Nothing saved yet. It saves facts here as it works.
        </p>
      ) : (
        <ul className="divide-y divide-line">
          {memories.map((memory) => (
            <li
              key={memory.id}
              className="flex items-start justify-between gap-4 py-3 text-sm"
            >
              <span className="leading-relaxed">{memory.fact}</span>
              <button
                type="button"
                onClick={() => onForget(memory.id)}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-muted hover:bg-raised hover:text-ink"
              >
                Forget
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
