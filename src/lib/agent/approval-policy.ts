import { createApproval, recordDecision } from "@/lib/agent/approvals";
import { getToolPolicy } from "@/lib/agent/policies";
import type { AgentTool, ToolArguments } from "@/lib/agent/tools";

async function runAlwaysAllowed(tool: AgentTool, args: ToolArguments): Promise<string> {
  let summary = tool.name;
  try {
    summary = await tool.summarize(args);
    const result = await tool.run(args);
    await recordDecision(tool.name, summary, args, "approved", result);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "The action failed.";
    await recordDecision(tool.name, summary, args, "failed", message);
    return message;
  }
}

export async function handleApprovalTool(
  tool: AgentTool,
  args: ToolArguments,
  approvalsCreated: number[],
): Promise<string> {
  const policy = await getToolPolicy(tool.name);
  if (policy === "off") {
    return "This action is turned off in Settings, so it did not run. Tell the user it is turned off.";
  }
  if (policy === "always") {
    return runAlwaysAllowed(tool, args);
  }
  try {
    const id = await createApproval(tool.name, await tool.summarize(args), args);
    approvalsCreated.push(id);
    return `Queued as approval #${id}. This has NOT been done yet. Tell the user it waits for their approval.`;
  } catch (error) {
    return error instanceof Error ? error.message : "The action could not be queued.";
  }
}
