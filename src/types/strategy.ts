export type UUID = string;

export type LogicOperator = "AND" | "OR";

export type ConditionType =
  | "technical_indicator"
  | "price_alert"
  | "volume_alert"
  | "wallet_inflow"
  | "custom";

export interface BaseCondition {
  id: UUID;
  type: ConditionType;
  label?: string;
  enabled?: boolean;
  payload: Record<string, any>;
}

export interface LogicNodeRef {
  ref: UUID;
}

export interface LogicNodeGroup {
  operator: LogicOperator;
  conditions: Array<LogicNodeRef | LogicNodeGroup>;
}

export interface StrategyModel {
  id: UUID;
  name: string;
  description?: string;
  schedule: string; // e.g. "1m", "5m", "1h"
  assets: string[];
  notification_preferences?: Record<string, any>;
  conditions: BaseCondition[];
  logic_tree: LogicNodeGroup;
}

// When creating/updating via your backend (StrategyCreateSchema),
// it likely expects the same fields as StrategyModel without 'id'.
export type StrategyCreatePayload = Omit<StrategyModel, "id">;