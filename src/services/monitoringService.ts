// src/services/monitoringService.ts

import { useAuthFetch } from "@/hooks/useAuthFetch";

// The structure inside the "snapshot" field from your logs
export interface LogicSnapshot {
  met: boolean;
  evaluated: Record<string, {
    met: boolean;
    value: number | null;
    details: any;
  }>;
  message?: string | null;
}

// The raw log object from /trigger_logs
export interface TriggerLogRaw {
  id: string;
  strategy_id: string;
  timestamp: string;
  snapshot: LogicSnapshot;
  message: string | null;
}

// The simplified log object for the UI list
export interface StrategyTriggerLog {
  id: string;
  name: string; // Derived by matching strategy_id to Strategy list
  time: string; // Formatted timestamp
  status: "TRIGGERED" | "HELD" | "FAILED";
  rawSnapshot: LogicSnapshot; // Passed to LogicVisualizer
}

export interface MetricsData {
  active_strategies: number;
  total_trigger_logs: number;
  // Latency is not in your current API, so we will handle it in the UI
}

export interface Strategy {
  id: string;
  name: string;
  status: string;
  schedule: string;
  trigger_count: number;
}

export const useMonitoringService = () => {
  const { fetchWithAuth } = useAuthFetch();

  const fetchMetrics = async (): Promise<MetricsData> => {
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "monitoring", path: "metrics" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch metrics");
    }
    return response.json();
  };

  const fetchTriggerLogs = async (): Promise<TriggerLogRaw[]> => {
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "monitoring", path: "trigger_logs" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch trigger logs");
    }
    return response.json();
  };
  
  const fetchHealth = async (): Promise<boolean> => {
    try {
      const response = await fetchWithAuth(
        "",
        undefined,
        { base: "monitoring", path: "health" }
      );
      return response.ok;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  };

  const fetchStrategies = async (): Promise<Strategy[]> => {
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "monitoring", path: "strategies" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch strategies");
    }
    return response.json();
  };

  return {
    fetchMetrics,
    fetchTriggerLogs,    
    fetchHealth,
    fetchStrategies,
  };
};