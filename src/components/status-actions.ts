export interface ActionMessages {
  working: string;
  done: string;
  fail: string;
}

interface ActionRule {
  method: string;
  pattern: RegExp;
  messages: ActionMessages;
}

function messages(working: string, done: string, failVerb: string): ActionMessages {
  return { working, done, fail: `Couldn't ${failVerb}. Try again` };
}

const rules: ActionRule[] = [
  { method: "POST", pattern: /^\/api\/chat$/, messages: messages("Sending your message", "Message sent", "send your message") },
  { method: "POST", pattern: /^\/api\/chat\/rewind$/, messages: messages("Preparing to resend", "Ready to resend", "resend") },
  { method: "POST", pattern: /^\/api\/conversations$/, messages: messages("Starting a new chat", "New chat ready", "start a new chat") },
  { method: "PATCH", pattern: /^\/api\/conversations\/[^/]+$/, messages: messages("Renaming chat", "Chat renamed", "rename the chat") },
  { method: "DELETE", pattern: /^\/api\/conversations\/[^/]+$/, messages: messages("Deleting chat", "Chat deleted", "delete the chat") },
  { method: "POST", pattern: /^\/api\/conversations\/[^/]+\/share$/, messages: messages("Creating share link", "Share link copied", "create the link") },
  { method: "DELETE", pattern: /^\/api\/conversations\/[^/]+\/share$/, messages: messages("Stopping sharing", "Sharing stopped", "stop sharing") },
  { method: "PUT", pattern: /^\/api\/settings$/, messages: messages("Saving settings", "Settings saved", "save settings") },
  { method: "DELETE", pattern: /^\/api\/memories$/, messages: messages("Forgetting memory", "Memory forgotten", "forget that memory") },
  { method: "POST", pattern: /^\/api\/approvals$/, messages: messages("Applying your decision", "Decision applied", "apply your decision") },
  { method: "POST", pattern: /^\/api\/auth\/logout$/, messages: messages("Signing out", "Signed out", "sign out") },
  { method: "POST", pattern: /^\/api\/account\/delete$/, messages: messages("Deleting your data", "Your data is deleted", "delete your data") },
  { method: "POST", pattern: /^\/api\/notifications$/, messages: messages("Marking alerts read", "Alerts marked read", "mark alerts read") },
  { method: "POST", pattern: /^\/api\/push\/subscribe$/, messages: messages("Turning on phone alerts", "Phone alerts on", "turn on phone alerts") },
  { method: "DELETE", pattern: /^\/api\/push\/subscribe$/, messages: messages("Turning off phone alerts", "Phone alerts off", "turn off phone alerts") },
  { method: "POST", pattern: /^\/api\/push\/test$/, messages: messages("Sending test alert", "Test alert sent", "send the test alert") },
  { method: "POST", pattern: /^\/api\/todos$/, messages: messages("Adding to-do", "To-do added", "add the to-do") },
  { method: "PATCH", pattern: /^\/api\/todos$/, messages: messages("Updating to-do", "To-do updated", "update the to-do") },
  { method: "DELETE", pattern: /^\/api\/todos$/, messages: messages("Deleting to-do", "To-do deleted", "delete the to-do") },
  { method: "POST", pattern: /^\/api\/briefing$/, messages: messages("Creating your briefing", "Briefing ready", "create the briefing") },
  { method: "POST", pattern: /^\/api\/bots$/, messages: messages("Creating Doombot", "Doombot created", "create the Doombot") },
  { method: "POST", pattern: /^\/api\/bots\/design$/, messages: messages("Designing Doombots", "Doombots designed", "design Doombots") },
  { method: "PATCH", pattern: /^\/api\/bots\/[^/]+$/, messages: messages("Saving Doombot", "Doombot saved", "save the Doombot") },
  { method: "DELETE", pattern: /^\/api\/bots\/[^/]+$/, messages: messages("Deleting Doombot", "Doombot deleted", "delete the Doombot") },
  { method: "POST", pattern: /^\/api\/bots\/[^/]+\/tasks$/, messages: messages("Assigning task", "Task assigned", "assign the task") },
  { method: "PUT", pattern: /^\/api\/bots\/[^/]+\/routine$/, messages: messages("Saving routine", "Routine saved", "save the routine") },
  { method: "DELETE", pattern: /^\/api\/bots\/[^/]+\/routine$/, messages: messages("Removing routine", "Routine removed", "remove the routine") },
  { method: "POST", pattern: /^\/api\/bots\/[^/]+\/routine\/run$/, messages: messages("Starting routine", "Routine started", "start the routine") },
  { method: "DELETE", pattern: /^\/api\/bots\/[^/]+\/memory$/, messages: messages("Deleting memory", "Memory deleted", "delete the memory") },
];

export function messagesFor(method: string, path: string): ActionMessages | null {
  const upper = method.toUpperCase();
  return rules.find((rule) => rule.method === upper && rule.pattern.test(path))?.messages ?? null;
}
