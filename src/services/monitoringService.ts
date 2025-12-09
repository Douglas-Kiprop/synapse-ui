import { useAuthFetch } from "@/hooks/useAuthFetch";

export interface StrategyTriggerLog {
  id: string;
  name: string;
  time: string;
  status: "TRIGGERED" | "HELD" | "FAILED";
}

export interface EvaluatedCondition {
  met: boolean;
  value: number;
  details: { [key: string]: any };
}

export interface EvaluationDetails {
  met: boolean;
  evaluated: {
    [key: string]: EvaluatedCondition;
  };
}

export interface EvaluationData {
  met: boolean;
  details: EvaluationDetails;
}

export interface MetricsData {
  active_strategies: number;
  total_trigger_logs: number;
  avg_eval_latency: string;
  trigger_success_rate: string;
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

  const fetchTriggerLogs = async (): Promise<StrategyTriggerLog[]> => {
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "monitoring", path: "trigger_log" }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch trigger logs");
    }
    return response.json();
  };

  const fetchEvaluationData = async (strategyId: string): Promise<EvaluationData> => {
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "monitoring", path: `evaluate/${strategyId}` }
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch evaluation data for strategy ${strategyId}`);
    }
    return response.json();
  };

  return {
    fetchMetrics,
    fetchTriggerLogs,
    fetchEvaluationData,
  };
};