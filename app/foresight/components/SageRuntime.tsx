"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type ThreadMessageLike,
  type ExternalStoreThreadListAdapter,
  type ExternalStoreThreadData,
} from "@assistant-ui/react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Id } from "@convex/_generated/dataModel";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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

const SageThreadIdContext = createContext<Id<"agentThreads"> | null>(null);
export function useSageThreadId() {
  return useContext(SageThreadIdContext);
}

export function SageProvider({
  contextPatientId,
  children,
}: {
  contextPatientId?: Id<"patients">;
  children: ReactNode;
}) {
  const threads = useQuery(api.queries.agent.myThreads, { limit: 50 });
  const [threadId, setThreadId] = useState<Id<"agentThreads"> | null>(null);

  // Auto-select the most recent thread when one exists and nothing is selected.
  useEffect(() => {
    if (threadId) return;
    if (!threads || threads.length === 0) return;
    setThreadId(threads[0]._id);
  }, [threads, threadId]);

  const messages = useQuery(
    api.queries.agent.messages,
    threadId ? { threadId } : ("skip" as any),
  ) as AgentMessageRow[] | undefined;

  const createThread = useMutation(api.mutations.agent.createThread);
  const deleteThread = useMutation(api.mutations.agent.deleteThread);
  const renameThread = useMutation(api.mutations.agent.renameThreadIfDefault);
  const runAgentTurn = useAction(api.agent.runAgentTurn.runAgentTurn);

  const [isRunning, setIsRunning] = useState(false);

  const onNew = useCallback(
    async (message: { content: readonly any[] }) => {
      const text = message.content
        .map((p: any) => (p?.type === "text" ? (p.text ?? "") : ""))
        .join("\n")
        .trim();
      if (!text) return;

      let activeId = threadId;
      if (!activeId) {
        activeId = await createThread({
          title: contextPatientId ? "Patient session" : "New thread",
          contextPatientId,
        });
        setThreadId(activeId);
      }

      const wasFirst = (messages?.length ?? 0) === 0;
      if (wasFirst) {
        void renameThread({ threadId: activeId, title: text });
      }

      setIsRunning(true);
      try {
        await runAgentTurn({
          threadId: activeId,
          userInput: text,
          contextPatientId,
        });
      } finally {
        setIsRunning(false);
      }
    },
    [
      threadId,
      contextPatientId,
      createThread,
      runAgentTurn,
      renameThread,
      messages?.length,
    ],
  );

  const externalThreads = useMemo<readonly ExternalStoreThreadData<"regular">[]>(() => {
    return (threads ?? []).map((t) => ({
      status: "regular" as const,
      id: t._id,
      title: t.title,
    }));
  }, [threads]);

  const threadListAdapter: ExternalStoreThreadListAdapter = useMemo(
    () => ({
      threadId: threadId ?? undefined,
      threads: externalThreads,
      onSwitchToNewThread: async () => {
        const id = await createThread({
          title: contextPatientId ? "Patient session" : "New thread",
          contextPatientId,
        });
        setThreadId(id);
      },
      onSwitchToThread: (id) => {
        setThreadId(id as Id<"agentThreads">);
      },
      onDelete: async (id) => {
        await deleteThread({ threadId: id as Id<"agentThreads"> });
        if (id === threadId) setThreadId(null);
      },
      onRename: async (id, newTitle) => {
        await renameThread({
          threadId: id as Id<"agentThreads">,
          title: newTitle,
        });
      },
    }),
    [
      threadId,
      externalThreads,
      createThread,
      deleteThread,
      renameThread,
      contextPatientId,
    ],
  );

  const runtime = useExternalStoreRuntime({
    isLoading: messages === undefined && threadId !== null,
    isRunning,
    messages: messages ?? [],
    setMessages: () => {},
    convertMessage,
    onNew,
    adapters: {
      threadList: threadListAdapter,
    },
  });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SageThreadIdContext.Provider value={threadId}>
        {children}
      </SageThreadIdContext.Provider>
    </AssistantRuntimeProvider>
  );
}
