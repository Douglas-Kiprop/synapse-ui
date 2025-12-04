export type UUID = string;

export type LogicOperator = "AND" | "OR";

export type Timeframe =
  | "1m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "4h"
  | "1d"
  | "1w";

export interface PriceAlertPayload {
  asset: string;
  direction: "above" | "below";
  target_price: number;
}

export interface TechnicalIndicatorPayload {
  indicator: string;
  asset: string;
  timeframe: Timeframe;
  params?: Record<string, any>;
  operator: string;
  value: number;
}

export type ConditionType =
  | "technical_indicator"
  | "price_alert"
  | "volume_alert"
  | "wallet_inflow"
  | "custom";

export type BaseCondition =
  | {
      id: UUID;
      type: "price_alert";
      label?: string;
      enabled?: boolean;
      payload: PriceAlertPayload;
    }
  | {
      id: UUID;
      type: "technical_indicator";
      label?: string;
      enabled?: boolean;
      payload: TechnicalIndicatorPayload;
    }
  | {
      id: UUID;
      type: Exclude<ConditionType, "price_alert" | "technical_indicator">;
      label?: string;
      enabled?: boolean;
      payload: Record<string, any>; // Fallback for other types
    };

export interface LogicNodeRef {
  ref: UUID;
}

export interface LogicNodeGroup {
  operator: LogicOperator;
  conditions: Array<LogicNodeRef | LogicNodeGroup>;
}

export interface Cooldown {
  enabled: boolean;
  duration_value: number;
  duration_unit: "s" | "m" | "h" | "d";
}

export interface NotificationPreferences {
  cooldown?: Cooldown;
}

export interface StrategyModel {
  id: UUID;
  name: string;
  description?: string;
  schedule: string; // e.g. "1m", "5m", "1h"
  assets: string[];
  notification_preferences?: NotificationPreferences;
  conditions: BaseCondition[];
  logic_tree: LogicNodeGroup;
  status: string;
  last_run_at?: string; // Assuming string for now, can be Date if needed
  trigger_count?: number;
}

// When creating/updating via your backend (StrategyCreateSchema),
// it likely expects the same fields as StrategyModel without 'id'.
export type StrategyCreatePayload = Omit<StrategyModel, "id">;