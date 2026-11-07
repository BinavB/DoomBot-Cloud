import { NextResponse } from "next/server";
import { loadMessages, runAgent, savePartialReply } from "@/lib/agent/run";
import { currentUserId } from "@/lib/auth/context";
import { withUser } from "@/lib/auth/route";
import { ownsConversation } from "@/lib/conversations";
import { AgentError } from "@/lib/errors";
import { isPdfDataUrl, readPdfText } from "@/lib/pdf";
import { takeChatSlot } from "@/lib/rate-limit";

const historyDisplayLimit = 200;
const maxMessageLength = 4000;
const conversationIdPattern = /^[0-9a-f-]{36}$|^main$/;
const maxImageLength = 3_500_000;
const imagePattern = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;

function isConversationId(value: unknown): value is string {
  return typeof value === "string" && conversationIdPattern.test(value);
}

export const GET = withUser(async (request: Request) => {
  const conversationId = new URL(request.url).searchParams.get("conversation");
  if (!isConversationId(conversationId) || !(await ownsConversation(conversationId))) {
    return NextResponse.json({ error: "That chat does not exist." }, { status: 404 });
  }
  return NextResponse.json({ messages: await loadMessages(conversationId, historyDisplayLimit) });
});

function sseEvent(payload: unknown): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(payload)}\n\n`);
}

export const POST = withUser(async (request: Request) => {
  const userId = currentUserId();
  if (!(await takeChatSlot(userId))) {
    return NextResponse.json({ error: "You are sending messages too fast. Wait a minute and try again." }, { status: 429 });
  }
  const body = (await request.json()) as {
    message?: unknown;
    conversationId?: unknown;
    image?: unknown;
    think?: unknown;
    pdf?: unknown;
    pdfName?: unknown;
  };
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const image = typeof body.image === "string" ? body.image : undefined;
  if (image !== undefined && (image.length > maxImageLength || !imagePattern.test(image))) {
    return NextResponse.json({ error: "Attach a PNG, JPEG or WebP image of up to 2.5 MB." }, { status: 400 });
  }
  if (message.length === 0 || message.length > maxMessageLength) {
    return NextResponse.json(
      { error: `Enter a message of up to ${maxMessageLength} characters.` },
      { status: 400 },
    );
  }
  let document: { name: string; text: string } | undefined;
  if (typeof body.pdf === "string") {
    if (!isPdfDataUrl(body.pdf)) {
      return NextResponse.json({ error: "Attach a PDF of up to 4 MB." }, { status: 400 });
    }
    try {
      const name = (typeof body.pdfName === "string" ? body.pdfName : "document.pdf").replace(/[^\w .-]/g, "").slice(0, 80);
      document = { name: name || "document.pdf", text: await readPdfText(body.pdf) };
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof AgentError ? error.message : "That PDF could not be read." },
        { status: 400 },
      );
    }
  }
  if (!isConversationId(body.conversationId) || !(await ownsConversation(body.conversationId))) {
    return NextResponse.json({ error: "That chat does not exist. Start a new chat." }, { status: 404 });
  }
  const conversationId = body.conversationId;
  const controller = new AbortController();
  let partial = "";
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(output) {
      const send = (payload: unknown) => {
        if (closed) {
          return;
        }
        try {
          output.enqueue(sseEvent(payload));
        } catch {
          closed = true;
        }
      };
      const close = () => {
        if (!closed) {
          closed = true;
          output.close();
        }
      };
      runAgent(message, {
        conversationId,
        image,
        document,
        think: body.think === true,
        signal: controller.signal,
        onToken: (text) => {
          partial += text;
          send({ type: "token", text });
        },
      })
        .then((result) => {
          send({ type: "done", reply: result.reply, approvalsCreated: result.approvalsCreated });
        })
        .catch(async (error: unknown) => {
          if (controller.signal.aborted) {
            await savePartialReply(conversationId, partial);
            return;
          }
          const text = error instanceof AgentError ? error.message : "The assistant could not answer.";
          console.error(`[chat] reply failed for conversation ${conversationId}:`, error);
          send({ type: "error", error: text });
        })
        .finally(close);
    },
    cancel() {
      closed = true;
      controller.abort();
    },
  });

  request.signal.addEventListener("abort", () => controller.abort());
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
});
