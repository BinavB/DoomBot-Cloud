import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";
import { AgentError } from "@/lib/errors";
import { approvalToolInfos, type ToolInfo } from "@/lib/agent/tools";

export const toolPolicies = ["ask", "always", "off"] as const;

export type ToolPolicy = (typeof toolPolicies)[number];

export interface ToolPolicyEntry extends ToolInfo {
  policy: ToolPolicy;
}

export function isToolPolicy(value: unknown): value is ToolPolicy {
  return toolPolicies.some((policy) => policy === value);
}

export async function getToolPolicy(tool: string): Promise<ToolPolicy> {
  const row = await queryRow<{ policy: string }>("SELECT policy FROM tool_policies WHERE user_id = ? AND tool = ?", [
    currentUserId(),
    tool,
  ]);
  return row && isToolPolicy(row.policy) ? row.policy : "ask";
}

export async function listToolPolicies(): Promise<ToolPolicyEntry[]> {
  const rows = await queryRows<{ tool: string; policy: string }>(
    "SELECT tool, policy FROM tool_policies WHERE user_id = ?",
    [currentUserId()],
  );
  const saved = new Map(rows.map((row) => [row.tool, row.policy]));
  return approvalToolInfos().map((info) => {
    const policy = saved.get(info.name);
    return { ...info, policy: isToolPolicy(policy) ? policy : "ask" };
  });
}

export async function setToolPolicy(tool: string, policy: ToolPolicy): Promise<void> {
  if (!approvalToolInfos().some((info) => info.name === tool)) {
    throw new AgentError("That action does not need approval, so it has no switch.");
  }
  if (policy === "ask") {
    await runStatement("DELETE FROM tool_policies WHERE user_id = ? AND tool = ?", [currentUserId(), tool]);
    return;
  }
  await runStatement(
    "INSERT INTO tool_policies (user_id, tool, policy) VALUES (?, ?, ?) ON CONFLICT (user_id, tool) DO UPDATE SET policy = excluded.policy",
    [currentUserId(), tool, policy],
  );
}
