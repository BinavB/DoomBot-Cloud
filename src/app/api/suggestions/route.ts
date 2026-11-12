import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { AgentError } from "@/lib/errors";
import { readBody } from "@/lib/http";
import { listOpenSuggestions, refreshSuggestions, setSuggestionStatus, type SuggestionStatus } from "@/lib/suggestions";

const statuses: SuggestionStatus[] = ["started", "hidden"];

export const GET = withUser(async () => NextResponse.json({ suggestions: await listOpenSuggestions() }));

export const POST = withUser(async () => {
  try {
    return NextResponse.json({ suggestions: await refreshSuggestions() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AgentError ? error.message : "Suggestions could not be made. Try again." },
      { status: 400 },
    );
  }
});

export const PATCH = withUser(async (request: Request) => {
  const body = await readBody<{ id?: unknown; status?: unknown }>(request);
  const status = statuses.find((candidate) => candidate === body?.status);
  if (!body || typeof body.id !== "number" || !status) {
    return NextResponse.json({ error: "Send a numeric id and a status of started or hidden." }, { status: 400 });
  }
  await setSuggestionStatus(body.id, status);
  return NextResponse.json({ ok: true });
});
