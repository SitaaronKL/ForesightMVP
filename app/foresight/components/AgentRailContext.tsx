"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AgentRailState = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
};

const AgentRailContext = createContext<AgentRailState>({
  collapsed: false,
  setCollapsed: () => {},
});

export function AgentRailProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <AgentRailContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </AgentRailContext.Provider>
  );
}

export function useAgentRail() {
  return useContext(AgentRailContext);
}
