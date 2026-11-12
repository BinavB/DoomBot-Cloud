import { AgentError } from "@/lib/errors";
import { googleGet, googleGetText } from "@/lib/google/client";

export const maxDriveResults = 10;
export const maxDriveTextLength = 8000;

const driveFileIdPattern = /^[A-Za-z0-9_-]{10,128}$/;
const googleDocMimeType = "application/vnd.google-apps.document";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

export function isDriveFileId(value: string): boolean {
  return driveFileIdPattern.test(value);
}

export function driveSearchQuery(term: string): string {
  const escaped = term.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `fullText contains '${escaped}' and trashed = false`;
}

export async function searchDriveFiles(term: string): Promise<string> {
  const url = new URL("https://www.googleapis.com/drive/v3/files");
  url.searchParams.set("q", driveSearchQuery(term));
  url.searchParams.set("pageSize", String(maxDriveResults));
  url.searchParams.set("fields", "files(id,name,mimeType,modifiedTime)");
  const data = await googleGet<{ files?: DriveFile[] }>(url.toString());
  const files = data.files ?? [];
  if (files.length === 0) {
    return "No Drive files match that search.";
  }
  return files
    .map((file) => `${file.name} | id: ${file.id} | modified: ${file.modifiedTime ?? "unknown"}`)
    .join("\n");
}

export async function readDriveFile(id: string): Promise<{ name: string; text: string }> {
  if (!isDriveFileId(id)) {
    throw new AgentError('"file_id" must be an id from search_drive_files.');
  }
  const file = await googleGet<DriveFile>(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=id,name,mimeType`,
  );
  const base = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}`;
  let text: string;
  if (file.mimeType === googleDocMimeType) {
    text = await googleGetText(`${base}/export?mimeType=text/plain`);
  } else if (file.mimeType.startsWith("text/")) {
    text = await googleGetText(`${base}?alt=media`);
  } else {
    throw new AgentError(`${file.name} cannot be read yet. Only Google Docs and plain text files can be read.`);
  }
  return { name: file.name, text: text.slice(0, maxDriveTextLength) };
}
