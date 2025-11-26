import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Plus, Trash2, TrendingUp, Target, DollarSign, AlertTriangle, Settings, Save, Share } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useStrategyService } from "@/services/strategyService";

// -------------------- Types --------------------

type UUID = string;

type LogicOperator = "AND" | "OR";

type ConditionType = "technical_indicator" | "price_alert" | "volume_alert" | "wallet_inflow" | "custom";

interface BaseCondition {
  id: UUID;
  type: ConditionType;
  label?: string;
  enabled?: boolean;
  payload: Record<string, any>;
}

interface LogicNodeRef {
  ref: UUID;
}

interface LogicNodeGroup {
  operator: LogicOperator;
  conditions: Array<LogicNodeRef | LogicNodeGroup>;
}

interface StrategyModel {
  id: UUID;
  name: string;
  description?: string;
  schedule: string; // "1m", "5m", "1h", etc
  assets: string[];
  notification_preferences?: Record<string, any>;
  conditions: BaseCondition[]; // flattened canonical conditions
  logic_tree: LogicNodeGroup;
  // extra fields like status/risk can be added as metadata
}

// -------------------- Utilities --------------------

const uid = (): UUID => {
  // fallback for older browsers if crypto.randomUUID is unavailable
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2, 9);
};

// -------------------- Primitive editors --------------------

function ConditionEditor({
  condition,
  onChange,
  onRemove,
}: {
  condition: BaseCondition;
  onChange: (c: BaseCondition) => void;
  onRemove: (id: UUID) => void;
}) {
  const indicators = ["rsi", "macd", "ema", "sma", "bollinger", "volume", "price_change"];
  return (
    <div className="p-3 border rounded-md bg-background/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center">
          <Label className="text-sm">Type</Label>
          <Select
            value={condition.type}
            onValueChange={(v: any) => onChange({ ...condition, type: v as ConditionType })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical_indicator">Technical Indicator</SelectItem>
              <SelectItem value="price_alert">Price Alert</SelectItem>
              <SelectItem value="volume_alert">Volume Alert</SelectItem>
              <SelectItem value="wallet_inflow">Wallet Inflow</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onRemove(condition.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* label */}
      <div>
        <Label className="text-sm">Label (optional)</Label>
        <Input
          value={condition.label ?? ""}
          onChange={(e) => onChange({ ...condition, label: e.target.value })}
        />
      </div>

      {/* payload editor per type (minimal examples) */}
      {condition.type === "technical_indicator" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label>Indicator</Label>
            <Select
              value={condition.payload.indicator ?? "rsi"}
              onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, indicator: v } })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {indicators.map((i) => <SelectItem key={i} value={i}>{i.toUpperCase()}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Operator</Label>
            <Select
              value={condition.payload.operator ?? "lt"}
              onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, operator: v } })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lt">Less than (&lt;)</SelectItem>
                <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                <SelectItem value="cross_above">Cross Above</SelectItem>
                <SelectItem value="cross_below">Cross Below</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value</Label>
            <Input
              type="number"
              value={(condition.payload.value ?? "") as any}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, value: parseFloat(e.target.value) || 0 } })}
            />
          </div>
        </div>
      )}

      {condition.type === "price_alert" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <Label>Asset</Label>
            <Input
              value={condition.payload.asset ?? "BTC"}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, asset: e.target.value } })}
            />
          </div>
          <div>
            <Label>Direction</Label>
            <Select
              value={condition.payload.direction ?? "below"}
              onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, direction: v } })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="below">Below</SelectItem>
                <SelectItem value="above">Above</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Price</Label>
            <Input
              type="number"
              value={(condition.payload.target_price ?? "") as any}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, target_price: parseFloat(e.target.value) || 0 } })}
            />
          </div>
        </div>
      )}

      {condition.type === "volume_alert" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label>Asset</Label>
            <Input
              value={condition.payload.asset ?? "BTC"}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, asset: e.target.value } })}
            />
          </div>
          <div>
            <Label>Threshold</Label>
            <Input
              type="number"
              value={(condition.payload.threshold ?? "") as any}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, threshold: parseFloat(e.target.value) || 0 } })}
            />
          </div>
        </div>
      )}

      {condition.type === "wallet_inflow" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <Label>Wallet Address</Label>
            <Input
              value={condition.payload.address ?? ""}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, address: e.target.value } })}
            />
          </div>
          <div>
            <Label>Min Amount</Label>
            <Input
              type="number"
              value={(condition.payload.min_amount ?? "") as any}
              onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, min_amount: parseFloat(e.target.value) || 0 } })}
            />
          </div>
        </div>
      )}

      {/* custom generic editor */}
      {condition.type === "custom" && (
        <div>
          <Label>JSON Payload</Label>
          <Textarea
            value={JSON.stringify(condition.payload ?? {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange({ ...condition, payload: parsed });
              } catch {
                // ignore parse errors for now
              }
            }}
          />
        </div>
      )}
    </div>
  );
}

// -------------------- Recursive Group UI --------------------

function GroupBlock({
  node,
  conditionsMap,
  onAddConditionToGroup,
  onAddGroupToGroup,
  onUpdateGroup,
  onRemoveGroup,
  onUpdateCondition,
  onRemoveCondition,
}: {
  node: LogicNodeGroup;
  conditionsMap: Record<UUID, BaseCondition>;
  onAddConditionToGroup: (group: LogicNodeGroup) => void;
  onAddGroupToGroup: (group: LogicNodeGroup) => void;
  onUpdateGroup: (group: LogicNodeGroup) => void;
  onRemoveGroup: () => void;
  onUpdateCondition: (condition: BaseCondition) => void;
  onRemoveCondition: (id: UUID) => void;
}) {
  return (
    <div className="border rounded-lg p-4 bg-background/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Group</Label>
          <Select
            value={node.operator}
            onValueChange={(v: any) => onUpdateGroup({ ...node, operator: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AND">AND</SelectItem>
              <SelectItem value="OR">OR</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onAddConditionToGroup(node)}>
            <Plus className="w-4 h-4 mr-2" /> Add Condition
          </Button>
          <Button size="sm" variant="outline" onClick={() => onAddGroupToGroup(node)}>
            <Plus className="w-4 h-4 mr-2" /> Add Group
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemoveGroup}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {node.conditions.map((item, idx) => {
          const isRef = (it: any): it is LogicNodeRef => "ref" in it;
          if (isRef(item)) {
            const cond = conditionsMap[item.ref];
            if (!cond) {
              return <div key={idx} className="p-3 bg-red-50 rounded">Missing condition {String(item.ref)}</div>;
            }
            return (
              <ConditionEditor
                key={cond.id}
                condition={cond}
                onChange={onUpdateCondition}
                onRemove={onRemoveCondition}
              />
            );
          } else {
            // nested group
            return (
              <div key={idx} className="pl-4">
                <GroupBlock
                  node={item}
                  conditionsMap={conditionsMap}
                  onAddConditionToGroup={onAddConditionToGroup}
                  onAddGroupToGroup={onAddGroupToGroup}
                  onUpdateGroup={(g) => {
                    const newConditions = [...node.conditions];
                    newConditions[idx] = g;
                    onUpdateGroup({ ...node, conditions: newConditions });
                  }}
                  onRemoveGroup={() => {
                    const newConditions = node.conditions.filter((_, i) => i !== idx);
                    onUpdateGroup({ ...node, conditions: newConditions });
                  }}
                  onUpdateCondition={onUpdateCondition}
                  onRemoveCondition={onRemoveCondition}
                />
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}

// -------------------- Main Component --------------------

interface AdvancedStrategyBuilderProps {
  initial?: Partial<StrategyModel>;
  onSave?: (payload: StrategyModel) => void;
}

export default function AdvancedStrategyBuilder({ initial, onSave }: AdvancedStrategyBuilderProps) {
  const { toast } = useToast();
  const { createStrategy, updateStrategy } = useStrategyService();
  const [saving, setSaving] = useState(false);

  // Build initial state using provided initial or defaults
  const [name, setName] = useState(initial?.name ?? "New Strategy");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "1m");
  const [assets, setAssets] = useState<string[]>(initial?.assets ?? []);
  const [conditions, setConditions] = useState<BaseCondition[]>(
    (initial?.conditions ?? []) as BaseCondition[]
  );
  const [logicTree, setLogicTree] = useState<LogicNodeGroup>(
    (initial?.logic_tree as LogicNodeGroup) ?? { operator: "AND", conditions: [] }
  );

  // helper map for quick lookup
  const conditionsMap = Object.fromEntries(conditions.map((c) => [c.id, c])) as Record<UUID, BaseCondition>;

  // Assets list
  const assetChoices = ["BTC", "ETH", "SOL", "AVAX", "MATIC", "ADA", "DOT", "LINK", "UNI", "AAVE"];

  const addAsset = (a: string) => setAssets((s) => (s.includes(a) ? s : [...s, a]));
  const removeAsset = (a: string) => setAssets((s) => s.filter((x) => x !== a));

  // condition helpers
  const createEmptyCondition = (type: ConditionType = "technical_indicator"): BaseCondition => ({
    id: uid(),
    type,
    label: "",
    enabled: true,
    payload:
      type === "technical_indicator"
        ? { indicator: "rsi", params: { period: 14 }, operator: "lt", value: 30, asset: "BTC", timeframe: "1h" }
        : type === "price_alert"
        ? { asset: "BTC", direction: "below", target_price: 60000 }
        : type === "volume_alert"
        ? { asset: "BTC", threshold: 100000000 }
        : {},
  });

  const addCondition = (type: ConditionType = "technical_indicator") => {
    const c = createEmptyCondition(type);
    setConditions((s) => [...s, c]);
    return c;
  };

  // Add condition to a given group by inserting a { ref: id } node
  const addConditionToGroup = (group: LogicNodeGroup, type: ConditionType = "technical_indicator") => {
    const c = addCondition(type);
    // mutate tree: find group instance and push ref
    const newTree = structuredClone(logicTree) as LogicNodeGroup;
    const pushed = pushRefToGroupNode(newTree, group, { ref: c.id });
    if (!pushed) {
      // fallback: push to root
      newTree.conditions.push({ ref: c.id });
    }
    setLogicTree(newTree);
  };

  const pushRefToGroupNode = (root: LogicNodeGroup, target: LogicNodeGroup, refNode: LogicNodeRef): boolean => {
    // compare by operator/content structure (no stable id on group), so use shallow object equality
    if (root === target) {
      root.conditions.push(refNode);
      return true;
    }
    for (let i = 0; i < root.conditions.length; i++) {
      const it = root.conditions[i];
      if (!("ref" in it)) {
        if (pushRefToGroupNode(it as LogicNodeGroup, target, refNode)) return true;
      }
    }
    return false;
  };

  const addGroupToGroup = (group: LogicNodeGroup) => {
    const newGroup: LogicNodeGroup = { operator: "AND", conditions: [] };
    const newTree = structuredClone(logicTree) as LogicNodeGroup;
    const pushed = pushRefToGroupNode(newTree, group, newGroup as any);
    if (!pushed) {
      newTree.conditions.push(newGroup as any);
    }
    setLogicTree(newTree);
  };

  const removeCondition = (id: UUID) => {
    setConditions((s) => s.filter((c) => c.id !== id));
    // remove refs from logic_tree
    const newTree = removeRefFromTree(logicTree, id);
    setLogicTree(newTree);
  };

  const removeRefFromTree = (node: LogicNodeGroup, refId: UUID): LogicNodeGroup => {
    const newNode: LogicNodeGroup = { operator: node.operator, conditions: [] };
    node.conditions.forEach((it) => {
      if ("ref" in it) {
        if (it.ref !== refId) newNode.conditions.push(it);
      } else {
        const child = removeRefFromTree(it as LogicNodeGroup, refId);
        // Only push child if it still contains conditions
        if ((child.conditions?.length ?? 0) > 0) newNode.conditions.push(child);
      }
    });
    return newNode;
  };

  const updateCondition = (updated: BaseCondition) => {
    setConditions((s) => s.map((c) => (c.id === updated.id ? updated : c)));
  };

  // update whole group in tree by reference equality
  const updateGroupInTree = (root: LogicNodeGroup, target: LogicNodeGroup, replacement: LogicNodeGroup): LogicNodeGroup => {
    if (root === target) return replacement;
    const newRoot: LogicNodeGroup = { operator: root.operator, conditions: [] };
    for (const it of root.conditions) {
      if ("ref" in it) {
        newRoot.conditions.push(it);
      } else {
        newRoot.conditions.push(updateGroupInTree(it as LogicNodeGroup, target, replacement));
      }
    }
    return newRoot;
  };

  // Add initial convenience helpers: add a condition to root if empty
  const ensureRootHasOne = useCallback(() => {
    if ((logicTree.conditions?.length ?? 0) === 0) {
      const c = createEmptyCondition();
      setConditions((s) => [...s, c]);
      setLogicTree((t) => ({ ...t, conditions: [{ ref: c.id }] }));
    }
  }, [logicTree]);

  // Save -> produce backend-ready payload
  const saveStrategy = async () => {
    // validation: ensure refs line up
    const referenced = new Set<string>();
    const collectRefs = (node: LogicNodeGroup) => {
      for (const it of node.conditions) {
        if ("ref" in it) referenced.add(it.ref);
        else collectRefs(it as LogicNodeGroup);
      }
    };
    collectRefs(logicTree);
    const missing = [...referenced].filter((r) => !conditions.find((c) => c.id === r));
    if (missing.length > 0) {
      toast({ title: "Invalid strategy", description: `Missing conditions for refs: ${missing.join(", ")}`, duration: 6000 });
      return;
    }

    // Build payload for backend (StrategyCreateSchema): omit id
    const payloadForBackend = {
      name,
      description,
      schedule,
      assets,
      notification_preferences: initial?.notification_preferences ?? {},
      conditions,
      logic_tree: logicTree,
    };

    setSaving(true);
    try {
      const saved = initial?.id
        ? await updateStrategy(String(initial.id), payloadForBackend)
        : await createStrategy(payloadForBackend);

      onSave?.(saved);
      toast({ title: "Strategy saved", description: `Saved strategy "${saved.name}"` });
    } catch (error: any) {
      console.error("Failed to create strategy", error);
      const errorMessage = error.message || "Failed to create strategy";
      toast({ title: "Save failed", description: errorMessage, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // UI rendering
  return (
    <div className="space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Strategy Builder</h1>
            <p className="text-muted-foreground">Build nested Boolean strategies (AND/OR)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={saveStrategy} size="sm" className="bg-gradient-primary" disabled={saving}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : "Save Strategy"}
          </Button>
        </div>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Settings className="w-5 h-5" /> Strategy Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Strategy Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Schedule</Label>
              <Select value={schedule} onValueChange={(v: any) => setSchedule(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">Every 1 minute</SelectItem>
                  <SelectItem value="5m">Every 5 minutes</SelectItem>
                  <SelectItem value="15m">Every 15 minutes</SelectItem>
                  <SelectItem value="1h">Every 1 hour</SelectItem>
                  <SelectItem value="4h">Every 4 hours</SelectItem>
                  <SelectItem value="24h">Every 24 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assets</Label>
              <Select onValueChange={(v: any) => addAsset(v)}>
                <SelectTrigger><SelectValue placeholder="Add asset" /></SelectTrigger>
                <SelectContent>
                  {assetChoices.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-2 mt-2 flex-wrap">
                {assets.map(a => (
                  <Badge key={a} className="flex items-center gap-2 px-3 py-1">
                    {a}
                    <Button variant="ghost" size="sm" onClick={() => removeAsset(a)}><Trash2 className="w-3 h-3" /></Button>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* Logic Tree */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Logic Tree</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => addConditionToGroup(logicTree as any)}>
                <Plus className="w-4 h-4 mr-2" /> Add Condition to Root
              </Button>
              <Button size="sm" variant="outline" onClick={() => addGroupToGroup(logicTree as any)}>
                <Plus className="w-4 h-4 mr-2" /> Add Group to Root
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <GroupBlock
            node={logicTree}
            conditionsMap={conditionsMap}
            onAddConditionToGroup={(g) => addConditionToGroup(g)}
            onAddGroupToGroup={(g) => addGroupToGroup(g)}
            onUpdateGroup={(g) => setLogicTree(g)}
            onRemoveGroup={() => {
              // clearing root is not allowed - reset to empty
              setLogicTree({ operator: "AND", conditions: [] });
            }}
            onUpdateCondition={updateCondition}
            onRemoveCondition={(id) => removeCondition(id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}