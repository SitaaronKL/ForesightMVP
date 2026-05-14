"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
} from "@assistant-ui/react";
import { useQuery, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import { useCallback, useMemo, useState, type ReactNode } from "react";

type AgentMessageRow = {
  _id: string;
  _creationTime: number;
  role: "user" | "assistant" | "tool" | "system";
  content: string;
  toolName?: string;
  toolArgs?: unknown;
  toolResult?: unknown;
};

function convertMessage(m: AgentMessageRow): ThreadMessageLike {
  if (m.role === "user") {
    return {
      id: m._id,
      role: "user",
      createdAt: new Date(m._creationTime),
      content: [{ type: "text", text: m.content || "" }],
    };
  }
  if (m.role === "tool") {
    // Render tool calls as assistant tool-call parts so they render under the
    // preceding assistant turn rather than as their own message bubble.
    return {
      id: m._id,
      role: "assistant",
      createdAt: new Date(m._creationTime),
      content: [
        {
          type: "tool-call",
          toolCallId: m._id,
          toolName: m.toolName ?? "tool",
          args: (m.toolArgs as object) ?? {},
          result: m.toolResult,
        } as any,
      ],
    };
  }
  if (m.role === "system") {
    return {
      id: m._id,
      role: "system",
      createdAt: new Date(m._creationTime),
      content: [{ type: "text", text: m.content || "" }],
    };
  }
  // assistant: skip empty / raw envelopes
  if (!m.content || m.content.startsWith('{"__rawItem')) {
    return {
      id: m._id,
      role: "assistant",
      createdAt: new Date(m._creationTime),
      content: [{ type: "text", text: "" }],
    };
  }
  return {
    id: m._id,
    role: "assistant",
    createdAt: new Date(m._creationTime),
    content: [{ type: "text", text: m.content }],
  };
}

/**
 * Sage runtime provider. Wraps children in an AssistantRuntimeProvider whose
 * external store reads agentMessages from Convex and dispatches new turns to
 * the runAgentTurn action.
 */
export function SageProvider({
  threadId,
  contextPatientId,
  children,
}: {
  threadId: Id<"agentThreads"> | null;
  contextPatientId?: Id<"patients">;
  children: ReactNode;
}) {
  const messages = useQuery(
    api.queries.agent.messages,
    threadId ? { threadId } : ("skip" as any),
  ) as AgentMessageRow[] | undefined;

  const runAgentTurn = useAction(api.agent.runAgentTurn.runAgentTurn);
  const [isRunning, setIsRunning] = useState(false);

  const items = useMemo(() => messages ?? [], [messages]);

  const onNew = useCallback(
    async (message: { content: readonly any[] }) => {
      if (!threadId) return;
      const text = message.content
        .map((p: any) => (p?.type === "text" ? (p.text ?? "") : ""))
        .join("\n")
        .trim();
      if (!text) return;
      setIsRunning(true);
      try {
        await runAgentTurn({ threadId, userInput: text, contextPatientId });
      } finally {
        setIsRunning(false);
      }
    },
    [threadId, contextPatientId, runAgentTurn],
  );

  const runtime = useExternalStoreRuntime({
    isLoading: messages === undefined,
    isRunning,
    messages: items,
    setMessages: () => {
      // Convex is the source of truth; ignore optimistic local writes.
    },
    convertMessage,
    onNew,
  });

  return <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>;
}
