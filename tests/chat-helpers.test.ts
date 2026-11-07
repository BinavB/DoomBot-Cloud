import { describe, expect, it } from "vitest";
import { classifyAttachment, maxImageBytes, maxPdfBytes } from "@/lib/attachments";
import { parseEventBlock, readEvents, type StreamEvent } from "@/lib/chat-stream";

function streamOf(...chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
        controller.close();
      },
    }),
  );
}

describe("stream reader", () => {
  it("parses events split across chunks", async () => {
    const seen: StreamEvent[] = [];
    await readEvents(
      streamOf('data: {"type":"token","te', 'xt":"Hi"}\n\ndata: {"type":"done","reply":"Hi"}\n\n'),
      (event) => seen.push(event),
    );
    expect(seen).toEqual([{ type: "token", text: "Hi" }, { type: "done", reply: "Hi" }]);
  });

  it("ignores malformed blocks", () => {
    expect(parseEventBlock("data: {not json")).toBeNull();
    expect(parseEventBlock(": keep-alive")).toBeNull();
  });
});

describe("attachments", () => {
  it("accepts supported types within the size limit", () => {
    expect(classifyAttachment("image/png", 1000)).toBe("image");
    expect(classifyAttachment("application/pdf", 1000)).toBe("pdf");
  });

  it("rejects wrong types and oversize files", () => {
    expect(classifyAttachment("image/gif", 1000)).toBeNull();
    expect(classifyAttachment("image/png", maxImageBytes + 1)).toBeNull();
    expect(classifyAttachment("application/pdf", maxPdfBytes + 1)).toBeNull();
  });
});
