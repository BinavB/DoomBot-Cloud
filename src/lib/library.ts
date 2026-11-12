import { currentUserId } from "@/lib/auth/context";
import { queryRows, runStatement } from "@/lib/database";

export const libraryLimit = 200;

export interface LibraryItem {
  id: number;
  title: string;
  body: string;
  createdAt: string;
}

export async function listLibrary(): Promise<LibraryItem[]> {
  return queryRows<LibraryItem>(
    "SELECT id, title, body, created_at AS createdAt FROM notes WHERE user_id = ? ORDER BY id DESC LIMIT ?",
    [currentUserId(), libraryLimit],
  );
}

export async function deleteLibraryItem(id: number): Promise<void> {
  await runStatement("DELETE FROM notes WHERE id = ? AND user_id = ?", [id, currentUserId()]);
}
