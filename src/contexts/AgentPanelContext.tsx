import { createContext, useContext, useEffect, useState } from "react";

type AgentPanelContextValue = {
  agentOpen: boolean;
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
};

const AgentPanelContext = createContext<AgentPanelContextValue | undefined>(undefined);

export function AgentPanelProvider({ children }: { children: React.ReactNode }) {
  const [agentOpen, setAgentOpen] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("agentOpen");
    if (saved !== null) {
      setAgentOpen(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("agentOpen", agentOpen.toString());
  }, [agentOpen]);

  const value: AgentPanelContextValue = {
    agentOpen,
    openAgent: () => setAgentOpen(true),
    closeAgent: () => setAgentOpen(false),
    toggleAgent: () => setAgentOpen((prev) => !prev),
  };

  return <AgentPanelContext.Provider value={value}>{children}</AgentPanelContext.Provider>;
}

export function useAgentPanel() {
  const ctx = useContext(AgentPanelContext);
  if (!ctx) {
    throw new Error("useAgentPanel must be used within an AgentPanelProvider");
  }
  return ctx;
}