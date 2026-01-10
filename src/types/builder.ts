import { BaseCondition as ApiBaseCondition } from "@/types/strategy";

export type UUID = string;
export type LogicOperator = "AND" | "OR";
export type ConditionType = 
  | "technical_indicator" 
  | "price_alert" 
  | "volume_alert" 
  | "wallet_flow" 
  | "exchange_flow" 
  | "liquidity_change"
  | "yield_change"
  | "impermanent_loss"
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
  id?: UUID;
  operator: LogicOperator;
  conditions: Array<LogicNodeRef | LogicNodeGroup>;
}

export interface StrategyModel {
  id?: UUID;
  name: string;
  description?: string;
  schedule: string;
  assets: string[];
  notification_preferences?: Record<string, any>;
  conditions: BaseCondition[];
  logic_tree: LogicNodeGroup;
}

// React Flow Data Types
export interface ConditionNodeData {
  condition: BaseCondition;
  onUpdate: (c: BaseCondition) => void;
  onRemove: (id: UUID) => void;
}

export interface GroupNodeData {
  group: LogicNodeGroup;
  onUpdate: (g: LogicNodeGroup) => void;
  onRemove: () => void;
  onAddCondition: (groupId: UUID) => void;
  onAddGroup: (groupId: UUID) => void;
}