interface ToolText {
  label: string;
  help: string;
}

const toolText: Record<string, ToolText> = {
  get_current_time: { label: "Current date and time", help: "Knows today's date and the time where you are." },
  get_weather: { label: "Weather", help: "Checks today's weather and forecast for your home city." },
  list_todos: { label: "Read your to-dos", help: "Looks at your to-do list and what is done." },
  add_todo: { label: "Add to-dos", help: "Adds new tasks to your to-do list." },
  update_todo: { label: "Edit to-dos", help: "Renames tasks and ticks them off or reopens them." },
  list_calendar_today: { label: "Today's calendar", help: "Reads today's events from your Google Calendar." },
  list_unread_emails: { label: "Unread emails", help: "Reads the sender and subject of your latest unread Gmail." },
  list_google_tasks: { label: "Google Tasks", help: "Reads your open tasks from Google Tasks." },
  list_notes: { label: "Saved notes", help: "Reads your most recent saved notes." },
};

export function humanize(name: string): string {
  const words = name.replace(/[_-]+/g, " ").trim();
  return words.length === 0 ? name : words.charAt(0).toUpperCase() + words.slice(1);
}

export function toolLabel(name: string): string {
  return toolText[name]?.label ?? humanize(name);
}

export function toolHelp(name: string, fallback: string): string {
  return toolText[name]?.help ?? fallback;
}
