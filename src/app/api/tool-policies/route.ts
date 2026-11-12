import { NextResponse } from "next/server";
import { isToolPolicy, listToolPolicies, setToolPolicy } from "@/lib/agent/policies";
import { withUser } from "@/lib/auth/route";
import { AgentError } from "@/lib/errors";
import { readBody } from "@/lib/http";

export const GET = withUser(async () => NextResponse.json({ tools: await listToolPolicies() }));

export const PUT = withUser(async (request: Request) => {
  const body = await readBody<{ tool?: unknown; policy?: unknown }>(request);
  if (!body || typeof body.tool !== "string" || !isToolPolicy(body.policy)) {
    return NextResponse.json({ error: "Send a tool name and a policy of ask, always or off." }, { status: 400 });
  }
  try {
    await setToolPolicy(body.tool, body.policy);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AgentError ? error.message : "The setting could not be saved." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
});
