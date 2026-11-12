export interface StreamEvent {
  type: "token" | "step" | "done" | "error";
  text?: string;
  reply?: string;
  approvalsCreated?: number[];
  error?: string;
}

export function parseEventBlock(block: string): StreamEvent | null {
  const line = block.split("\n").find((item) => item.startsWith("data: "));
  if (!line) {
    return null;
  }
  try {
    return JSON.parse(line.slice(6)) as StreamEvent;
  } catch {
    return null;
  }
}

export async function readEvents(response: Response, onEvent: (event: StreamEvent) => void): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response");
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return;
    }
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      const event = parseEventBlock(block);
      if (event) {
        onEvent(event);
      }
    }
  }
}
