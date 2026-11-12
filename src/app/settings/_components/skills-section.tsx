"use client";

import { useEffect, useState } from "react";
import { PageNotice } from "@/components/page-notice";
import { maxSkillInstructionsLength } from "@/lib/skill-limits";

interface Skill {
  id: number;
  name: string;
  instructions: string;
}

export function SkillsSection() {
  const [skills, setSkills] = useState<Skill[] | null>(null);
  const [name, setName] = useState("");
  const [instructions, setInstructions] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/skills")
      .then((response) => response.json() as Promise<{ skills: Skill[] }>)
      .then((loaded) => setSkills(loaded.skills))
      .catch(() => setError("Skills could not load. Reload the page to try again."));
  }, []);

  async function addSkill() {
    setError(null);
    const response = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, instructions }),
    });
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "The skill could not be saved. Try again.");
      return;
    }
    const reloaded = await fetch("/api/skills").then((result) => result.json() as Promise<{ skills: Skill[] }>);
    setSkills(reloaded.skills);
    setName("");
    setInstructions("");
  }

  async function removeSkill(id: number) {
    const response = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setSkills((current) => (current ? current.filter((skill) => skill.id !== id) : current));
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
      <h2 className="font-display text-lg font-semibold">Skills</h2>
      <p className="text-sm text-muted">
        A skill is a set of steps you save once. Type its name in chat, such as /mail-brief, and DOOMBOT follows the steps for that message.
      </p>
      {error && <PageNotice tone="error">{error}</PageNotice>}
      {skills && skills.length === 0 && <p className="text-sm text-muted">No skills yet.</p>}
      <ul className="flex flex-col gap-2">
        {skills?.map((skill) => (
          <li key={skill.id} className="flex items-start justify-between gap-3 rounded-xl border border-line px-3 py-2">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-sm font-semibold">/{skill.name}</span>
              <span className="whitespace-pre-line text-sm leading-relaxed text-muted">{skill.instructions}</span>
            </div>
            <button
              type="button"
              onClick={() => void removeSkill(skill.id)}
              className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted hover:bg-raised hover:text-danger"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-3 border-t border-line pt-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Name, using letters, numbers and hyphens</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={30}
            placeholder="mail-brief"
            className="h-11 rounded-xl border border-line bg-transparent px-3 text-base outline-none placeholder:text-muted focus:border-doom md:text-[15px]"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted">Steps to follow</span>
          <textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
            maxLength={maxSkillInstructionsLength}
            rows={4}
            placeholder="For example: Check unread mail, list the three that need an answer, and say why."
            className="rounded-xl border border-line bg-transparent px-3 py-2 text-base leading-relaxed outline-none placeholder:text-muted focus:border-doom md:text-[15px]"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void addSkill()}
            disabled={name.trim().length === 0 || instructions.trim().length === 0}
            className="h-10 rounded-xl bg-doom px-4 text-sm font-semibold text-canvas disabled:opacity-40"
          >
            Add skill
          </button>
        </div>
      </div>
    </section>
  );
}
