import { createChatCompletion } from "@/lib/ai";
import { openingMessages, setAutoTitle, userMessageCount } from "@/lib/conversations";

const titleLength = 60;
const retitleAtUserMessage = new Set([1, 3]);
const excerptLength = 300;
const instruction =
  "Write a short title of 2 to 5 words that names the main topic of this chat. Reply with the title only: no quotes, no full stop, no emoji, in the same language as the user.";

export function cleanTitle(raw: string | null): string {
  const firstLine = (raw ?? "").split("\n")[0] ?? "";
  return firstLine
    .replace(/^["'\u201c\u201d\u2018\u2019`*#\s]+|["'\u201c\u201d\u2018\u2019`*.:;,\s]+$/g, "")
    .replace(/\s+/g, " ")
    .slice(0, titleLength)
    .trim();
}

export async function autoTitleConversation(conversationId: string): Promise<void> {
  try {
    if (!retitleAtUserMessage.has(await userMessageCount(conversationId))) {
      return;
    }
    const opening = await openingMessages(conversationId, 6);
    const transcript = opening
      .map((message) => `${message.role === "user" ? "User" : "Assistant"}: ${message.content.slice(0, excerptLength)}`)
      .join("\n");
    const completion = await createChatCompletion(
      [
        { role: "system", content: instruction },
        { role: "user", content: transcript },
      ],
      undefined,
      { reasoningEffort: "low" },
    );
    const title = cleanTitle(completion.content);
    if (title.length > 0) {
      await setAutoTitle(conversationId, title);
    }
  } catch (error) {
    console.error(`[title] could not name conversation ${conversationId}:`, error);
  }
}
