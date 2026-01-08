import { UUID, LogicNodeGroup, LogicNodeRef, BaseCondition } from "@/types/builder";

export const uid = (): UUID => {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2, 9);
};

export const ensureGroupHasId = (group: any): LogicNodeGroup => {
  if (!group.id) {
    return { id: uid(), operator: group.operator || "AND", conditions: group.conditions || [] };
  }
  return group as LogicNodeGroup;
};

// Normalize: ensure every group in the tree has a stable id
export const normalizeLogicTree = (node: any): LogicNodeGroup => {
  const g = ensureGroupHasId(node);
  return {
    id: g.id!,
    operator: g.operator || "AND",
    conditions: (g.conditions || []).map((child: any) =>
      "ref" in child ? child : normalizeLogicTree(child)
    ),
  };
};

export const getPreviewData = (condition: BaseCondition) => {
  const base = condition.type === "technical_indicator" ? 30 : 50000;
  return Array.from({ length: 10 }).map((_, i) => ({
    time: i,
    value: base + Math.sin(i) * (base * 0.1) + Math.random() * (base * 0.05)
  }));
};

export const getPreviewSummary = (condition: BaseCondition) => {
  const p = condition.payload || {};
  switch (condition.type) {
    case "technical_indicator": return `${p.indicator?.toUpperCase() || 'RSI'} ${p.operator || '<'} ${p.value || 30}`;
    case "price_alert": return `${p.asset || 'Asset'} ${p.direction || 'crosses'} ${p.target_price || '0'}`;
    case "volume_alert": return `Volume > ${p.threshold || 0}`;
    case "wallet_flow": 
      return `${p.direction === 'inflow' ? 'Inflow' : 'Outflow'} to ${p.label || 'Wallet'} > ${p.value || 0} ${p.asset || ''}`;
    case "exchange_flow":
      return `${p.exchange || 'Exchange'} ${p.flow_type || 'Net Flow'} > ${p.value || 0} ${p.asset || ''}`;
    default: return "Custom Condition";
  }
};

// Logic Helpers for Tree Manipulation
export const updateGroupInTree = (root: LogicNodeGroup, updated: LogicNodeGroup): LogicNodeGroup => {
    if (root.id === updated.id) return updated;
    return {
        ...root,
        conditions: root.conditions.map(c => {
            if ("ref" in c) return c;
            return updateGroupInTree(c as LogicNodeGroup, updated);
        })
    };
};

export const removeGroupFromTree = (root: LogicNodeGroup, targetId: UUID): LogicNodeGroup => {
    return {
        ...root,
        conditions: root.conditions.filter(c => {
            if ("ref" in c) return true;
            return (c as LogicNodeGroup).id !== targetId;
        }).map(c => {
             if ("ref" in c) return c;
             return removeGroupFromTree(c as LogicNodeGroup, targetId);
        })
    };
};

export const removeRefFromTree = (node: LogicNodeGroup, refId: UUID): LogicNodeGroup => {
  const newNode: LogicNodeGroup = { id: node.id || uid(), operator: node.operator, conditions: [] };
  if (!node.conditions) return newNode;
  node.conditions.forEach((it) => {
    if ("ref" in it) { if (it.ref !== refId) newNode.conditions.push(it); } 
    else { const child = removeRefFromTree(it as LogicNodeGroup, refId); if(child.conditions.length > 0) newNode.conditions.push(child); }
  });
  return newNode;
};

