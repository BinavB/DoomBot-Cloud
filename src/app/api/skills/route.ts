import { NextResponse } from "next/server";
import { withUser } from "@/lib/auth/route";
import { AgentError } from "@/lib/errors";
import { readBody } from "@/lib/http";
import { deleteSkill, listSkills, readSkillInput, saveSkill } from "@/lib/skills";

export const GET = withUser(async () => NextResponse.json({ skills: await listSkills() }));

export const POST = withUser(async (request: Request) => {
  const body = await readBody<{ name?: unknown; instructions?: unknown }>(request);
  try {
    await saveSkill(readSkillInput(body ?? {}));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof AgentError ? error.message : "The skill could not be saved." },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true });
});

export const DELETE = withUser(async (request: Request) => {
  const body = await readBody<{ id?: unknown }>(request);
  if (!body || typeof body.id !== "number") {
    return NextResponse.json({ error: "Send a numeric id." }, { status: 400 });
  }
  await deleteSkill(body.id);
  return NextResponse.json({ ok: true });
});
