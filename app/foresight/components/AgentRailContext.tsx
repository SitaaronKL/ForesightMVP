"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type AgentRailState = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  width: number;
  setWidth: (n: number) => void;
};

const DEFAULT_WIDTH = 400;
export const RAIL_MIN_WIDTH = 320;
export const RAIL_MAX_WIDTH = 720;

const AgentRailContext = createContext<AgentRailState>({
  collapsed: false,
  setCollapsed: () => {},
  width: DEFAULT_WIDTH,
  setWidth: () => {},
});

export function AgentRailProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  return (
    <AgentRailContext.Provider
      value={{ collapsed, setCollapsed, width, setWidth }}
    >
      {children}
    </AgentRailContext.Provider>
  );
}

export function useAgentRail() {
  return useContext(AgentRailContext);
}
