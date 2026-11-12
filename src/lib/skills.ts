import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";
import { AgentError } from "@/lib/errors";
import { maxSkillInstructionsLength, maxSkills } from "@/lib/skill-limits";

const skillNamePattern = /^[a-z0-9][a-z0-9-]{1,29}$/;
const skillCallPattern = /^\/([a-z0-9][a-z0-9-]{1,29})(?:\s+([\s\S]*))?$/;

export interface Skill {
  id: number;
  name: string;
  instructions: string;
}

export interface SkillCall {
  name: string;
  request: string;
}

export function parseSkillCall(message: string): SkillCall | null {
  const match = skillCallPattern.exec(message.trim());
  if (!match) {
    return null;
  }
  return { name: match[1], request: (match[2] ?? "").trim() };
}

export function readSkillInput(input: { name?: unknown; instructions?: unknown }): {
  name: string;
  instructions: string;
} {
  const name = typeof input.name === "string" ? input.name.trim().toLowerCase() : "";
  if (!skillNamePattern.test(name)) {
    throw new AgentError("Skill names use 2 to 30 letters, numbers or hyphens, such as mail-brief.");
  }
  const instructions = typeof input.instructions === "string" ? input.instructions.trim() : "";
  if (instructions.length === 0 || instructions.length > maxSkillInstructionsLength) {
    throw new AgentError(`Skill instructions must be 1 to ${maxSkillInstructionsLength} characters.`);
  }
  return { name, instructions };
}

export async function listSkills(): Promise<Skill[]> {
  return queryRows<Skill>("SELECT id, name, instructions FROM skills WHERE user_id = ? ORDER BY name", [
    currentUserId(),
  ]);
}

export async function findSkill(name: string): Promise<Skill | undefined> {
  return queryRow<Skill>("SELECT id, name, instructions FROM skills WHERE user_id = ? AND name = ?", [
    currentUserId(),
    name,
  ]);
}

export async function saveSkill(input: { name: string; instructions: string }): Promise<void> {
  const existing = await listSkills();
  if (existing.some((skill) => skill.name === input.name)) {
    throw new AgentError(`You already have a skill called /${input.name}.`);
  }
  if (existing.length >= maxSkills) {
    throw new AgentError(`You can save up to ${maxSkills} skills. Delete one first.`);
  }
  await runStatement("INSERT INTO skills (user_id, name, instructions) VALUES (?, ?, ?)", [
    currentUserId(),
    input.name,
    input.instructions,
  ]);
}

export async function deleteSkill(id: number): Promise<void> {
  await runStatement("DELETE FROM skills WHERE id = ? AND user_id = ?", [id, currentUserId()]);
}
