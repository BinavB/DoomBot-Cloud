import { currentUserId } from "@/lib/auth/context";
import { queryRow, queryRows, runStatement } from "@/lib/database";
import { findTool, type ToolArguments } from "@/lib/agent/tools";
import { setToolPolicy } from "@/lib/agent/policies";

export interface Approval {
  id: number;
  tool: string;
  summary: string;
  status: string;
  result: string | null;
  createdAt: string;
}

export interface Decision {
  id: number;
  summary: string;
  status: string;
  result: string | null;
  resolvedAt: string | null;
}

export type ApprovalDecision = "approve" | "always" | "deny";

const recentDecisionLimit = 20;

interface ApprovalRow {
  id: number;
  tool: string;
  summary: string;
  arguments: string;
  status: string;
  result: string | null;
  created_at: string;
}

function toApproval(row: ApprovalRow): Approval {
  return {
    id: row.id,
    tool: row.tool,
    summary: row.summary,
    status: row.status,
    result: row.result,
    createdAt: row.created_at,
  };
}

export async function createApproval(tool: string, summary: string, args: ToolArguments): Promise<number> {
  const row = await queryRow<{ id: number }>(
    "INSERT INTO approvals (user_id, tool, summary, arguments) VALUES (?, ?, ?, ?) RETURNING id",
    [currentUserId(), tool, summary, JSON.stringify(args)],
  );
  return (row as { id: number }).id;
}

export async function recordDecision(
  tool: string,
  summary: string,
  args: ToolArguments,
  status: "approved" | "failed",
  result: string,
): Promise<void> {
  await runStatement(
    "INSERT INTO approvals (user_id, tool, summary, arguments, status, result, resolved_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
    [currentUserId(), tool, summary, JSON.stringify(args), status, result],
  );
}

export async function listRecentDecisions(): Promise<Decision[]> {
  const rows = await queryRows<{ id: number; summary: string; status: string; result: string | null; resolved_at: string | null }>(
    "SELECT id, summary, status, result, resolved_at FROM approvals WHERE user_id = ? AND status != 'pending' ORDER BY id DESC LIMIT ?",
    [currentUserId(), recentDecisionLimit],
  );
  return rows.map((row) => ({
    id: row.id,
    summary: row.summary,
    status: row.status,
    result: row.result,
    resolvedAt: row.resolved_at,
  }));
}

export async function listPendingApprovals(): Promise<Approval[]> {
  const rows = await queryRows<ApprovalRow>(
    "SELECT * FROM approvals WHERE user_id = ? AND status = 'pending' ORDER BY id",
    [currentUserId()],
  );
  return rows.map(toApproval);
}

function findPending(id: number): Promise<ApprovalRow | undefined> {
  return queryRow<ApprovalRow>("SELECT * FROM approvals WHERE id = ? AND user_id = ? AND status = 'pending'", [
    id,
    currentUserId(),
  ]);
}

function closeApproval(id: number, status: string, result: string): Promise<void> {
  return runStatement(
    "UPDATE approvals SET status = ?, result = ?, resolved_at = datetime('now') WHERE id = ? AND user_id = ?",
    [status, result, id, currentUserId()],
  );
}

function parseStoredArguments(json: string): ToolArguments {
  const value: unknown = JSON.parse(json);
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as ToolArguments)
    : {};
}

export async function decideApproval(id: number, decision: ApprovalDecision): Promise<Approval | null> {
  const row = await findPending(id);
  if (!row) {
    return null;
  }

  if (decision === "deny") {
    await closeApproval(id, "denied", "Refused by you.");
  } else {
    if (decision === "always") {
      await setToolPolicy(row.tool, "always");
    }
    const tool = findTool(row.tool);
    if (!tool) {
      await closeApproval(id, "failed", `Unknown tool: ${row.tool}`);
    } else {
      try {
        await closeApproval(id, "approved", await tool.run(parseStoredArguments(row.arguments)));
      } catch (error) {
        await closeApproval(id, "failed", error instanceof Error ? error.message : "The action failed.");
      }
    }
  }

  const updated = await queryRow<ApprovalRow>("SELECT * FROM approvals WHERE id = ? AND user_id = ?", [
    id,
    currentUserId(),
  ]);
  return toApproval(updated as ApprovalRow);
}
