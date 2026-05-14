import type {
  Session,
  AgentInputItem,
} from "@openai/agents";
import { ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * ConvexSession: implements the Agents SDK Session interface against the
 * agentThreads / agentMessages tables.
 *
 * Each AgentInputItem is serialized to JSON and stored in agentMessages.content
 * with the appropriate role mapping. This keeps history queryable from Convex
 * for the demo's audit story.
 */
export class ConvexSession implements Session {
  constructor(
    private ctx: ActionCtx,
    private threadId: Id<"agentThreads">,
    private userId: Id<"users">,
  ) {}

  async getSessionId(): Promise<string> {
    return this.threadId as unknown as string;
  }

  async getItems(limit?: number): Promise<AgentInputItem[]> {
    const rows = await this.ctx.runQuery(
      internal.queries.agent._internalListMessages,
      { threadId: this.threadId },
    );
    const items: AgentInputItem[] = rows
      .map((r: any) => {
        try {
          const parsed = JSON.parse(r.content);
          if (parsed && typeof parsed === "object" && parsed.__rawItem) {
            return parsed.item as AgentInputItem;
          }
        } catch {}
        // Treat as plain text input by role.
        if (r.role === "user") {
          return { role: "user", content: r.content } as AgentInputItem;
        }
        if (r.role === "assistant") {
          return {
            role: "assistant",
            content: [{ type: "output_text", text: r.content }],
          } as unknown as AgentInputItem;
        }
        return null;
      })
      .filter((x: any): x is AgentInputItem => x !== null);
    return limit ? items.slice(-limit) : items;
  }

  async addItems(items: AgentInputItem[]): Promise<void> {
    // Look up the most-recent persisted message so we can skip duplicates.
    // Specifically: the client writes the user's input optimistically before
    // calling runAgentTurn for instant feedback. The SDK then also calls
    // addItems with that same user message at the start of the run; we
    // detect that here and skip.
    const existing = await this.ctx.runQuery(
      internal.queries.agent._internalListMessages,
      { threadId: this.threadId },
    );
    const lastRow: any = existing.length > 0 ? existing[existing.length - 1] : null;

    for (const item of items) {
      const role = inferRole(item);
      const content = extractText(item) ?? JSON.stringify({ __rawItem: true, item });

      // Skip a user item that exactly matches the most recently persisted
      // user message (within ~5s).
      if (
        role === "user" &&
        lastRow &&
        lastRow.role === "user" &&
        typeof lastRow.content === "string" &&
        lastRow.content.trim() === content.trim() &&
        Date.now() - lastRow._creationTime < 10_000
      ) {
        continue;
      }

      const { toolName, toolArgs, toolResult } = extractToolFields(item);
      await this.ctx.runMutation(
        internal.mutations.agent._internalAppendMessage,
        {
          threadId: this.threadId,
          userId: this.userId,
          role: role as any,
          content,
          toolName,
          toolArgs,
          toolResult,
        },
      );
    }
  }

  async popItem(): Promise<AgentInputItem | undefined> {
    // Not used in the demo flow; we never pop. Return undefined.
    return undefined;
  }

  async clearSession(): Promise<void> {
    // No-op for the demo; we keep history for audit.
  }
}

function inferRole(item: any): "user" | "assistant" | "tool" | "system" {
  if (item?.role === "user") return "user";
  if (item?.role === "assistant") return "assistant";
  if (item?.role === "system") return "system";
  if (item?.type === "function_call") return "assistant";
  if (item?.type === "function_call_result" || item?.type === "function_call_output") return "tool";
  return "assistant";
}

function extractText(item: any): string | null {
  if (typeof item?.content === "string") return item.content;
  if (Array.isArray(item?.content)) {
    const text = item.content
      .map((c: any) => c.text ?? c.output_text ?? "")
      .filter(Boolean)
      .join("\n");
    if (text) return text;
  }
  if (typeof item?.output === "string") return item.output;
  return null;
}

function extractToolFields(item: any): {
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: unknown;
} {
  if (item?.type === "function_call") {
    return { toolName: item.name, toolArgs: safeParseJson(item.arguments) };
  }
  if (item?.type === "function_call_result" || item?.type === "function_call_output") {
    return { toolName: item.name, toolResult: item.output ?? item.result };
  }
  return {};
}

function safeParseJson(s: unknown): unknown {
  if (typeof s !== "string") return s;
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}
