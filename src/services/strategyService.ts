import { useAuthFetch } from "@/hooks/useAuthFetch";
import type {
  StrategyModel,
  StrategyCreatePayload,
} from "@/types/strategy";

type StrategyUpdatePayload = Partial<StrategyCreatePayload>;

export const useStrategyService = () => {
  const { fetchWithAuth } = useAuthFetch();

  // Create
  const createStrategy = async (
    strategy: StrategyCreatePayload
  ): Promise<StrategyModel> => {
    const response = await fetchWithAuth(
      "", // input ignored when 'base' is provided
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategy),
      },
      { base: "synapse", path: "strategies" }
    );
    if (!response.ok) {
      let bodyText: string | undefined;
      let errorData: any = undefined;
      try {
        bodyText = await response.text();
        errorData = bodyText ? JSON.parse(bodyText) : undefined;
      } catch {
        // not JSON; keep the raw text
      }
      const detail = errorData?.detail ?? errorData?.message ?? bodyText ?? "Failed to create strategy";
      const msg = typeof detail === "string" ? detail : JSON.stringify(detail);
      const err: any = new Error(msg);
      err.status = response.status;
      err.data = errorData ?? bodyText;
      throw err;
    }
    return response.json();
  };

  // Update
  const updateStrategy = async (
    id: string,
    strategy: StrategyUpdatePayload
  ): Promise<StrategyModel> => {
    const response = await fetchWithAuth(
      "",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategy),
      },
      { base: "synapse", path: `strategies/${id}` }
    );
    if (!response.ok) {
      let bodyText: string | undefined;
      let errorData: any = undefined;
      try {
        bodyText = await response.text();
        errorData = bodyText ? JSON.parse(bodyText) : undefined;
      } catch {
        // not JSON; keep the raw text
      }
      const detail = errorData?.detail ?? errorData?.message ?? bodyText ?? "Failed to update strategy";
      const msg = typeof detail === "string" ? detail : JSON.stringify(detail);
      const err: any = new Error(msg);
      err.status = response.status;
      err.data = errorData ?? bodyText;
      throw err;
    }
    return response.json();
  };

  // Read one
  const getStrategy = async (id: string): Promise<StrategyModel> => {
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "synapse", path: `strategies/${id}` }
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error("Strategy not found");
      throw new Error("Failed to fetch strategy");
    }
    return response.json();
  };

  // List all (optional status filter)
  const listStrategies = async (status?: string): Promise<StrategyModel[]> => {
    const path = status ? `strategies?status=${encodeURIComponent(status)}` : "strategies";
    const response = await fetchWithAuth(
      "",
      undefined,
      { base: "synapse", path }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to list strategies");
    }
    return response.json();
  };



  // Delete
  const deleteStrategy = async (id: string): Promise<void> => {
    const response = await fetchWithAuth(
      "",
      { method: "DELETE" },
      { base: "synapse", path: `strategies/${id}` }
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error("Strategy not found");
      throw new Error("Failed to delete strategy");
    }
  };

  return {
    createStrategy,
    getStrategy,
    listStrategies,
    updateStrategy,
    deleteStrategy,
  };
};