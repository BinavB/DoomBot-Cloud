import { Markdown } from "@/components/markdown";
import {
  formatTime,
  sourceLabels,
  statusStyles,
  type BotTask,
} from "@/lib/bots/client";

interface TaskListProps {
  tasks: BotTask[];
}

function statusText(status: string): string {
  if (status === "running") {
    return "Working";
  }
  return status === "done" ? "Done" : "Failed";
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-base font-semibold">Tasks</h3>
      {tasks.length === 0 ? (
        <p className="text-sm text-muted">
          No tasks yet. Assign one above, or ask in Chat.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span
                  className={`font-medium ${statusStyles[task.status] ?? ""}`}
                >
                  {statusText(task.status)}
                </span>
                <span>
                  {sourceLabels[task.source] ?? "Task"},{" "}
                  {formatTime(task.createdAt)}
                </span>
              </div>
              <p className="font-medium">{task.instruction}</p>
              {task.result && <Markdown text={task.result} />}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
