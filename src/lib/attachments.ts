export type AttachmentKind = "image" | "pdf";

export const maxImageBytes = 2.5 * 1024 * 1024;
export const maxPdfBytes = 4 * 1024 * 1024;
export const attachmentHelp = "Attach a PNG, JPEG or WebP image up to 2.5 MB, or a PDF up to 4 MB.";

const imageTypes = ["image/png", "image/jpeg", "image/webp"];

export function classifyAttachment(type: string, size: number): AttachmentKind | null {
  if (type === "application/pdf") {
    return size <= maxPdfBytes ? "pdf" : null;
  }
  if (imageTypes.includes(type)) {
    return size <= maxImageBytes ? "image" : null;
  }
  return null;
}
