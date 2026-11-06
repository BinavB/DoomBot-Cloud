import { extractText, getDocumentProxy } from "unpdf";
import { AgentError } from "@/lib/errors";

export const maxPdfDataLength = 5_500_000;
export const maxPdfCharacters = 20_000;
const pdfPattern = /^data:application\/pdf;base64,[A-Za-z0-9+/=]+$/;

export function isPdfDataUrl(value: string): boolean {
  return value.length <= maxPdfDataLength && pdfPattern.test(value);
}

export async function readPdfText(dataUrl: string): Promise<string> {
  try {
    const bytes = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
    const pdf = await getDocumentProxy(new Uint8Array(bytes));
    const { text } = await extractText(pdf, { mergePages: true });
    const cleaned = text.replace(/\s+\n/g, "\n").trim();
    if (cleaned.length === 0) {
      throw new AgentError("No text could be read from that PDF. It may be a scan.");
    }
    return cleaned.slice(0, maxPdfCharacters);
  } catch (error) {
    if (error instanceof AgentError) {
      throw error;
    }
    throw new AgentError("That PDF could not be read.");
  }
}
