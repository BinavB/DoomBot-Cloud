import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "doombot-test-"));
process.env.TURSO_DATABASE_URL = `file:${join(directory, "test.db")}`;
process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-1234";
