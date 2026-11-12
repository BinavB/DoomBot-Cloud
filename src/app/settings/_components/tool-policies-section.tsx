"use client";

import { useEffect, useState } from "react";
import { PageNotice } from "@/components/page-notice";

type ToolPolicy = "ask" | "always" | "off";

interface ToolSwitch {
  name: string;
  policy: ToolPolicy;
}

const policyOptions: { value: ToolPolicy; label: string }[] = [
  { value: "ask", label: "Ask me" },
  { value: "always", label: "Always allow" },
  { value: "off", label: "Turn off" },
];

function toLabel(name: string): string {
  const words = name.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function ToolPoliciesSection() {
  const [tools, setTools] = useState<ToolSwitch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tool-policies")
      .then((response) => response.json() as Promise<{ tools: ToolSwitch[] }>)
      .then((data) => setTools(data.tools))
      .catch(() => setError("Permissions could not load. Reload the page to try again."));
  }, []);

  async function choose(name: string, policy: ToolPolicy) {
    setError(null);
    const response = await fetch("/api/tool-policies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: name, policy }),
    });
    if (!response.ok) {
      setError("That setting could not be saved. Try again.");
      return;
    }
    setTools((current) => current?.map((tool) => (tool.name === name ? { ...tool, policy } : tool)) ?? current);
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-line bg-panel p-5">
      <h2 className="font-display text-lg font-semibold">Permissions</h2>
      <p className="text-sm text-muted">
        Choose what DOOMBOT may do without asking. Always allow skips the approval step. Turn off stops the action completely.
      </p>
      {error && <PageNotice tone="error">{error}</PageNotice>}
      <ul className="flex flex-col divide-y divide-line">
        {tools?.map((tool) => (
          <li key={tool.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <span className="text-sm font-medium">{toLabel(tool.name)}</span>
            <div role="group" aria-label={toLabel(tool.name)} className="flex rounded-xl border border-line p-1">
              {policyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={tool.policy === option.value}
                  onClick={() => void choose(tool.name, option.value)}
                  className={`h-8 rounded-lg px-3 text-xs font-medium ${
                    tool.policy === option.value ? "bg-doom text-canvas" : "text-muted hover:bg-raised"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
