// Top-level imports in StrategyBuilder.tsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Settings, 
  Save, 
  Undo2, 
  Redo2, 
  GitBranch,
  Activity,
  ListTree,
  Network
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useStrategyService } from "@/services/strategyService";
import type { StrategyModel as ApiStrategyModel, LogicNodeGroup as ApiLogicNodeGroup, StrategyCreatePayload, NotificationPreferences, BaseCondition as ApiBaseCondition } from "@/types/strategy";
import { Checkbox } from "@/components/ui/checkbox";

// --- React Flow Imports ---
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Handle,
  Position,
} from "reactflow";
import "reactflow/dist/style.css";

// --- Recharts for Previews ---
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

// ==========================================
// 1. INTERNAL HISTORY HOOK
// ==========================================

function useHistory<T>(initialState: T) {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<T[]>([initialState]);

  const state = useMemo(() => history[index], [history, index]);

  const setState = useCallback((action: T | ((prev: T) => T)) => {
    setHistory((prev) => {
      const current = prev[index];
      const next = typeof action === 'function' ? (action as Function)(current) : action;
      if (JSON.stringify(current) === JSON.stringify(next)) return prev;
      const newHistory = prev.slice(0, index + 1);
      newHistory.push(next);
      return newHistory;
    });
    setIndex((prev) => prev + 1);
  }, [index]);

  const undo = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const redo = useCallback(() => setIndex((i) => Math.min(history.length - 1, i + 1)), [history]);

  return { state, setState, undo, redo, canUndo: index > 0, canRedo: index < history.length - 1 };
}

// ==========================================
// 2. TYPES & UTILITIES
// ==========================================

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
  id?: UUID;
  operator: LogicOperator;
  conditions: Array<LogicNodeRef | LogicNodeGroup>;
}

interface StrategyModel {
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
interface ConditionNodeData {
  condition: BaseCondition;
  onUpdate: (c: BaseCondition) => void;
  onRemove: (id: UUID) => void;
}

interface GroupNodeData {
  group: LogicNodeGroup;
  onUpdate: (g: LogicNodeGroup) => void;
  onRemove: () => void;
  onAddCondition: (groupId: UUID) => void;
  onAddGroup: (groupId: UUID) => void;
}

const uid = (): UUID => {
  if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
    return (crypto as any).randomUUID();
  }
  return "id-" + Math.random().toString(36).slice(2, 9);
};

const ensureGroupHasId = (group: any): LogicNodeGroup => {
  if (!group.id) {
    return { id: uid(), operator: group.operator || "AND", conditions: group.conditions || [] };
  }
  return group as LogicNodeGroup;
};

// Normalize: ensure every group in the tree has a stable id
const normalizeLogicTree = (node: any): LogicNodeGroup => {
  const g = ensureGroupHasId(node);
  return {
    id: g.id!,
    operator: g.operator || "AND",
    conditions: (g.conditions || []).map((child: any) =>
      "ref" in child ? child : normalizeLogicTree(child)
    ),
  };
};
const getPreviewData = (condition: BaseCondition) => {
  const base = condition.type === "technical_indicator" ? 30 : 50000;
  return Array.from({ length: 10 }).map((_, i) => ({
    time: i,
    value: base + Math.sin(i) * (base * 0.1) + Math.random() * (base * 0.05)
  }));
};

const getPreviewSummary = (condition: BaseCondition) => {
  const p = condition.payload || {};
  switch (condition.type) {
    case "technical_indicator": return `${p.indicator?.toUpperCase() || 'RSI'} ${p.operator || '<'} ${p.value || 30}`;
    case "price_alert": return `${p.asset || 'Asset'} ${p.direction || 'crosses'} ${p.target_price || '0'}`;
    case "volume_alert": return `Volume > ${p.threshold || 0}`;
    default: return "Custom Condition";
  }
};

// ==========================================
// 3. VISUAL MODE: CUSTOM NODES
// ==========================================

const ConditionNode: React.FC<{ data: ConditionNodeData; selected?: boolean }> = ({ data, selected }) => {
  const [editing, setEditing] = useState(false);
  const { condition, onRemove, onUpdate } = data;

  return (
    <div className={cn("relative w-[280px] rounded-xl border-2 bg-card shadow-xl transition-all", selected ? "border-blue-500 ring-4 ring-blue-500/20" : "border-border/60")}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-4 !h-4" />
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{condition.type.replace(/_/g, ' ')}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemove(condition.id)}><Trash2 className="w-3 h-3" /></Button>
      </div>
      <div className="p-3 space-y-3">
        <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-[10px] font-mono bg-background">ID: {condition.id.slice(0,4)}</Badge>
            <span className="text-xs font-medium truncate max-w-[150px]">{getPreviewSummary(condition)}</span>
        </div>
        <div className="h-16 w-full bg-background/50 rounded-md border overflow-hidden">
           <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getPreviewData(condition)}>
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
           </ResponsiveContainer>
        </div>
        {editing ? (
             <div className="space-y-2 pt-1 border-t">
                <Input value={condition.label || ""} placeholder="Label" onChange={(e) => onUpdate({...condition, label: e.target.value})} className="h-7 text-xs" />
                <Button size="sm" variant="secondary" className="w-full h-6 text-xs" onClick={() => setEditing(false)}>Done</Button>
             </div>
        ) : (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-background/50" onClick={() => setEditing(true)}>Edit Parameters</Button>
        )}
      </div>
    </div>
  );
};

const GroupNode: React.FC<{ data: GroupNodeData; selected?: boolean }> = ({ data, selected }) => {
  const { group, onRemove, onUpdate, onAddCondition, onAddGroup } = data;
  return (
    <div className={cn("relative min-w-[200px] rounded-xl border-2 bg-card shadow-lg transition-all", selected ? "border-purple-500 ring-4 ring-purple-500/20" : "border-border/60")}>
       <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-4 !h-4" />
       <div className={cn("p-2 rounded-t-lg flex justify-between items-center border-b", group.operator === "AND" ? "bg-green-500/10" : "bg-blue-500/10")}>
            <div className="flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-foreground/70" />
                <Select value={group.operator} onValueChange={(v) => onUpdate({...group, operator: v as LogicOperator})}>
                    <SelectTrigger className="h-7 w-[80px] text-xs font-bold bg-background shadow-sm border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="AND">AND</SelectItem><SelectItem value="OR">OR</SelectItem></SelectContent>
                </Select>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={onRemove}><Trash2 className="w-3 h-3" /></Button>
       </div>
       <div className="p-2 flex gap-1 bg-muted/20 rounded-b-lg">
            <Button variant="secondary" size="sm" className="flex-1 h-7 text-xs shadow-sm bg-background hover:bg-background/80" onClick={() => onAddCondition(group.id)}><Plus className="w-3 h-3 mr-1" /> Cond</Button>
            <Button variant="secondary" size="sm" className="flex-1 h-7 text-xs shadow-sm bg-background hover:bg-background/80" onClick={() => onAddGroup(group.id)}><Plus className="w-3 h-3 mr-1" /> Group</Button>
       </div>
       <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-4 !h-4" />
    </div>
  );
};

const nodeTypes = { condition: ConditionNode, group: GroupNode };

// ==========================================
// 4. VISUAL MODE: FLOW ENGINE
// ==========================================

function LogicTreeFlow({
  conditions, logicTree, onConditionsChange, onLogicTreeChange, onAddConditionToGroup, onAddGroupToGroup
}: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const buildFlow = useCallback(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const visitedNodes = new Set<string>(); // Fix: Track visited nodes to prevent duplicate keys
    const visitedEdges = new Set<string>(); // Fix: Track visited edges
    let xCounter = 0;

    const traverse = (node: LogicNodeGroup | LogicNodeRef, parentId: string | null, depth: number) => {
      const isRef = "ref" in node;
      const id = isRef ? (node as LogicNodeRef).ref : (node as LogicNodeGroup).id; // Access ID directly but safely
      
      // Safety check for missing ID
      if (!id) return;

      // Fix: If we have already added this node to the visual graph, skip it.
      // This prevents the "Encountered two children with the same key" error if data has duplicates.
      if (visitedNodes.has(id)) return;
      visitedNodes.add(id);

      const positionX = xCounter * 320;
      const positionY = depth * 180;

      if (isRef) {
        const cond = conditions.find((c: any) => c.id === id);
        if (cond) {
            newNodes.push({
                id: cond.id, type: 'condition', position: { x: positionX, y: positionY },
                data: {
                    condition: cond,
                    onUpdate: (u: BaseCondition) => onConditionsChange(conditions.map((c: any) => c.id === u.id ? u : c)),
                    onRemove: (rid: string) => {
                        onConditionsChange(conditions.filter((c: any) => c.id !== rid));
                        onLogicTreeChange(removeRefFromTree(logicTree, rid));
                    }
                }
            });
            xCounter++;
        }
      } else {
        const group = ensureGroupHasId(node as LogicNodeGroup);
        const currentX = positionX;
        
        newNodes.push({
            id: group.id!, type: 'group', position: { x: currentX, y: positionY },
            data: {
                group,
                onUpdate: (g: LogicNodeGroup) => onLogicTreeChange(updateGroupInTree(logicTree, g)),
                onRemove: () => parentId ? onLogicTreeChange(removeGroupFromTree(logicTree, group.id!)) : onLogicTreeChange({ ...group, conditions: [] }),
                onAddCondition: onAddConditionToGroup,
                onAddGroup: onAddGroupToGroup
            }
        });

        if (parentId) {
             const edgeId = `${parentId}-${group.id}`;
             if (!visitedEdges.has(edgeId)) {
                newEdges.push({ id: edgeId, source: parentId, target: group.id!, type: 'smoothstep', style: { stroke: '#94a3b8', strokeWidth: 2 } });
                visitedEdges.add(edgeId);
             }
        }

        if (group.conditions && group.conditions.length > 0) {
            group.conditions.forEach((child) => {
                const childId = "ref" in child ? child.ref : (child as LogicNodeGroup).id;
                if(childId) {
                    const edgeId = `${group.id}-${childId}`;
                    if(!visitedEdges.has(edgeId)) {
                        newEdges.push({ id: edgeId, source: group.id!, target: childId, type: 'default', style: { stroke: '#94a3b8', strokeWidth: 2 } });
                        visitedEdges.add(edgeId);
                    }
                    traverse(child, group.id!, depth + 1);
                }
            });
        } else {
             xCounter++;
        }
      }
    };

    traverse(logicTree, null, 0);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [conditions, logicTree, setNodes, setEdges, onConditionsChange, onLogicTreeChange]);

  useEffect(() => { buildFlow(); }, [buildFlow]);

  return (
    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} nodeTypes={nodeTypes} fitView attributionPosition="bottom-right" defaultEdgeOptions={{ type: 'smoothstep', animated: true }}>
      <Background color="#94a3b8" gap={20} size={1} variant={BackgroundVariant.Dots} />
      <Controls />
      <MiniMap style={{ height: 100 }} zoomable pannable />
    </ReactFlow>
  );
}

// ==========================================
// 5. SIMPLE MODE: RECURSIVE LIST & EDITOR
// ==========================================

const ConditionEditor = ({ condition, onChange, onRemove }: { condition: BaseCondition; onChange: (c: BaseCondition) => void; onRemove: (id: UUID) => void; }) => {
  const indicators = ["rsi", "macd", "ema", "sma", "bollinger", "volume", "price_change"];
  
  return (
    <div className="p-4 border rounded-xl bg-card hover:border-primary/30 transition-colors shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{condition.type.replace(/_/g, ' ').toUpperCase()}</Badge>
          <Select value={condition.type} onValueChange={(v: any) => onChange({ ...condition, type: v as ConditionType })}>
            <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="technical_indicator">Technical Indicator</SelectItem>
              <SelectItem value="price_alert">Price Alert</SelectItem>
              <SelectItem value="volume_alert">Volume Alert</SelectItem>
              <SelectItem value="wallet_inflow">Wallet Inflow</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onRemove(condition.id)} className="h-7 w-7 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
      </div>

      <div className="grid gap-4">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Label (Optional)</Label>
          <Input value={condition.label ?? ""} onChange={(e) => onChange({ ...condition, label: e.target.value })} className="h-8" placeholder="e.g. RSI Dip Condition" />
        </div>

        {condition.type === "technical_indicator" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Indicator</Label>
              <Select value={condition.payload.indicator ?? "rsi"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, indicator: v } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{indicators.map((i) => <SelectItem key={i} value={i}>{i.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Operator</Label>
              <Select value={condition.payload.operator ?? "lt"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, operator: v } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lt">Less than (&lt;)</SelectItem>
                  <SelectItem value="gt">Greater than (&gt;)</SelectItem>
                  <SelectItem value="cross_above">Cross Above</SelectItem>
                  <SelectItem value="cross_below">Cross Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Value</Label>
              <Input type="number" value={condition.payload.value ?? ""} onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, value: parseFloat(e.target.value) || 0 } })} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Timeframe</Label>
              <Select value={condition.payload.timeframe ?? "1h"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, timeframe: v } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="30m">30 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="4h">4 Hours</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        
        {condition.type !== "technical_indicator" && (
             <div className="p-3 bg-muted/20 rounded-md text-sm text-muted-foreground border border-dashed text-center">
                 Configure {condition.type.replace(/_/g, ' ')} parameters here.
             </div>
        )}
      </div>
    </div>
  );
};

const SimpleLogicTree = ({ node, conditions, depth = 0, onUpdateGroup, onRemoveGroup, onAddCondition, onAddGroup, onUpdateCondition, onRemoveCondition }: any) => {
    if ("ref" in node) {
        const cond = conditions.find((c: any) => c.id === node.ref);
        if (!cond) return <div className="p-2 text-red-500 text-xs border rounded bg-red-50">Missing Condition</div>;
        return <div className="ml-6"><ConditionEditor condition={cond} onChange={onUpdateCondition} onRemove={onRemoveCondition} /></div>;
    }

    const group = ensureGroupHasId(node) as LogicNodeGroup;
    const isRoot = depth === 0;

    return (
        <div className={cn("flex flex-col gap-4 p-4 rounded-xl border-l-4 transition-all", isRoot ? "bg-slate-50/50 border-l-slate-400" : "ml-6 mt-4 bg-white border border-slate-200 shadow-sm", group.operator === "AND" ? "border-l-green-500" : "border-l-purple-500")}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={cn("text-xs font-bold px-2 py-1", group.operator === "AND" ? "bg-green-100 text-green-700 border-green-200" : "bg-purple-100 text-purple-700 border-purple-200")}>
                        {group.operator} GROUP
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={group.operator} onValueChange={(v: any) => onUpdateGroup({...group, operator: v})}>
                        <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="AND">AND (All)</SelectItem><SelectItem value="OR">OR (Any)</SelectItem></SelectContent>
                    </Select>
                    {!isRoot && <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemoveGroup(group.id)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {group.conditions.length === 0 && <div className="text-xs text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">Empty group. Add conditions or subgroups below.</div>}
                {group.conditions.map((child: any, idx: number) => (
                    <SimpleLogicTree 
                        key={idx} node={child} conditions={conditions} depth={depth + 1}
                        onUpdateGroup={(g: any) => {
                             const newConditions = [...group.conditions];
                             newConditions[idx] = g;
                             onUpdateGroup({...group, conditions: newConditions});
                        }}
                        onRemoveGroup={(id: any) => {
                             const newConditions = group.conditions.filter((_, i) => i !== idx);
                             onUpdateGroup({...group, conditions: newConditions});
                        }}
                        onAddCondition={onAddCondition} onAddGroup={onAddGroup} onUpdateCondition={onUpdateCondition} onRemoveCondition={onRemoveCondition}
                    />
                ))}
            </div>

            <div className="flex gap-3 pt-2">
                <Button size="sm" variant="outline" className="text-xs flex-1 border-dashed h-9 bg-background/50 hover:bg-background" onClick={() => onAddCondition(group.id)}><Plus className="w-3 h-3 mr-2 text-blue-500" /> Add Condition</Button>
                <Button size="sm" variant="outline" className="text-xs flex-1 border-dashed h-9 bg-background/50 hover:bg-background" onClick={() => onAddGroup(group.id)}><GitBranch className="w-3 h-3 mr-2 text-purple-500" /> Add Logic Group</Button>
            </div>
        </div>
    );
};

// ==========================================
// 6. LOGIC HELPERS
// ==========================================

const updateGroupInTree = (root: LogicNodeGroup, updated: LogicNodeGroup): LogicNodeGroup => {
    if (root.id === updated.id) return updated;
    return {
        ...root,
        conditions: root.conditions.map(c => {
            if ("ref" in c) return c;
            return updateGroupInTree(c as LogicNodeGroup, updated);
        })
    };
};

const removeGroupFromTree = (root: LogicNodeGroup, targetId: UUID): LogicNodeGroup => {
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

const removeRefFromTree = (node: LogicNodeGroup, refId: UUID): LogicNodeGroup => {
  const newNode: LogicNodeGroup = { id: node.id || uid(), operator: node.operator, conditions: [] };
  if (!node.conditions) return newNode;
  node.conditions.forEach((it) => {
    if ("ref" in it) { if (it.ref !== refId) newNode.conditions.push(it); } 
    else { const child = removeRefFromTree(it as LogicNodeGroup, refId); if(child.conditions.length > 0) newNode.conditions.push(child); }
  });
  return newNode;
};

// ==========================================
// 7. MAIN COMPONENT
// ==========================================

interface AdvancedStrategyBuilderProps {
  initial?: Partial<ApiStrategyModel>;
  onSave?: (payload: ApiStrategyModel) => void;
}

export default function AdvancedStrategyBuilder({ initial, onSave }: AdvancedStrategyBuilderProps) {
  const { toast } = useToast();
  const { createStrategy, updateStrategy } = useStrategyService();
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"visual" | "simple">("visual");

  // -- State --
  const initialConditions = useMemo(() => (initial?.conditions ?? []) as BaseCondition[], [initial]);
  const initialLogicTree = useMemo(() => {
    const tree = (initial?.logic_tree as LogicNodeGroup) ?? { operator: "AND", conditions: [] };
    return normalizeLogicTree(tree);
  }, [initial]);

  const { state: conditions, setState: setConditions, undo: undoConditions, redo: redoConditions, canUndo, canRedo } = useHistory(initialConditions);
  const { state: logicTree, setState: setLogicTree, undo: undoTree, redo: redoTree } = useHistory(initialLogicTree);

  // -- Metadata --
  const [name, setName] = useState(initial?.name ?? "New Strategy");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [schedule, setSchedule] = useState(initial?.schedule ?? "1m");
  const [assets, setAssets] = useState<string[]>(initial?.assets ?? []);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(initial?.notification_preferences ?? {
    cooldown: {
      enabled: false,
      duration_value: 1,
      duration_unit: "h",
    }
  });
  
  const addAsset = (a: string) => { if(!assets.includes(a)) setAssets([...assets, a]); };
  const removeAsset = (a: string) => setAssets(assets.filter(x => x !== a));

  // -- Logic Actions --
  const createEmptyCondition = (type: ConditionType = "technical_indicator"): BaseCondition => ({
    id: uid(), type, label: "", enabled: true,
    payload: type === "technical_indicator" ? { indicator: "rsi", params: { period: 14 }, operator: "lt", value: 30, asset: "BTC", timeframe: "1h" } : {},
  });

  const addConditionToGroup = (targetId: UUID) => {
    const newCondition = createEmptyCondition();
    setConditions((prev) => [...prev, newCondition]);
    setLogicTree((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      const addToGroup = (node: LogicNodeGroup): boolean => {
        if (node.id === targetId) { node.conditions.push({ ref: newCondition.id }); return true; }
        for (const child of node.conditions) { 
          if (!("ref" in child)) { 
            if (addToGroup(child as LogicNodeGroup)) return true; 
          } 
        }
        return false;
      };
      addToGroup(cloned);
      return ensureGroupHasId(cloned);
    });
  };

  const addGroupToGroup = (targetId: UUID) => {
    const newGroup: LogicNodeGroup = { id: uid(), operator: "AND", conditions: [] };
    setLogicTree((prev) => {
      const cloned = JSON.parse(JSON.stringify(prev));
      const addToGroup = (node: LogicNodeGroup): boolean => {
        if (node.id === targetId) { node.conditions.push(newGroup); return true; }
        for (const child of node.conditions) { 
          if (!("ref" in child)) { 
            if (addToGroup(child as LogicNodeGroup)) return true; 
          } 
        }
        return false;
      };
      addToGroup(cloned);
      return ensureGroupHasId(cloned);
    });
  };

  // Shared Handlers
  const handleUpdateGroup = (g: LogicNodeGroup) => setLogicTree(updateGroupInTree(logicTree, g));
  const handleRemoveCondition = (id: UUID) => {
      setConditions(conditions.filter(c => c.id !== id));
      setLogicTree(removeRefFromTree(logicTree, id));
  };
  const handleUpdateCondition = (c: BaseCondition) => setConditions(conditions.map(old => old.id === c.id ? c : old));

  // Default Init
  useEffect(() => {
    if (logicTree.conditions.length === 0 && conditions.length === 0) {
        const c = createEmptyCondition();
        setConditions([c]);
        setLogicTree({ ...logicTree, conditions: [{ ref: c.id }]});
    }
  }, [logicTree, conditions]);

  // Save
  function stripGroupIds(node: LogicNodeGroup): ApiLogicNodeGroup {
    const mapChild = (child: LogicNodeRef | LogicNodeGroup): ApiLogicNodeGroup | LogicNodeRef => {
      if ("ref" in child) return child;
      return stripGroupIds(child as LogicNodeGroup);
    };
    return {
      operator: node.operator,
      conditions: (node.conditions ?? []).map(mapChild),
    };
  }

  const saveStrategy = async () => {
    if (!name) return toast({ title: "Error", description: "Name required", variant: "destructive" });
    setSaving(true);
    try {
        const payload: StrategyCreatePayload = {
            name,
            description,
            schedule,
            assets,
            conditions: conditions as unknown as ApiBaseCondition[],
            logic_tree: stripGroupIds(logicTree),
            notification_preferences: notificationPreferences,
            status: initial?.status ?? "paused",
            // last_run_at and trigger_count are optional for create payload
        };

        const result = initial?.id
            ? await updateStrategy(initial.id, payload)
            : await createStrategy(payload);

        onSave?.(result);
        toast({ title: "Success", description: "Strategy saved successfully." });
    } catch (e: any) {
        const msg = typeof e?.message === "string" ? e.message : "Unknown error";
        toast({ title: "Failed", description: msg, variant: "destructive" });
    } finally {
        setSaving(false);
    }
  };

  return (
    <ReactFlowProvider>
      <div className="flex flex-col h-full space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl border border-primary/20 shadow-sm">
                    <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Strategy Studio</h1>
                    <p className="text-muted-foreground text-sm">Design algorithmic strategies visually or via logic steps.</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="bg-muted/50 p-1 rounded-lg border flex mr-4">
                    <Button 
                      variant={viewMode === "visual" ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setViewMode("visual")} 
                      className={cn("text-xs gap-2 h-8", viewMode === "visual" && "bg-background shadow-sm font-semibold")}
                    >
                        <Network className="w-3.5 h-3.5"/> Visual
                    </Button>
                    <Button 
                      variant={viewMode === "simple" ? "secondary" : "ghost"} 
                      size="sm" 
                      onClick={() => setViewMode("simple")} 
                      className={cn("text-xs gap-2 h-8", viewMode === "simple" && "bg-background shadow-sm font-semibold")}
                    >
                        <ListTree className="w-3.5 h-3.5"/> Logic Tree
                    </Button>
                </div>
                <Separator orientation="vertical" className="h-6 mx-2" />
                <Button variant="outline" size="sm" onClick={undoConditions} disabled={!canUndo} className="w-9 px-0"><Undo2 className="w-4 h-4" /></Button>
                <Button variant="outline" size="sm" onClick={redoConditions} disabled={!canRedo} className="w-9 px-0"><Redo2 className="w-4 h-4" /></Button>
                <Button onClick={saveStrategy} disabled={saving} className="min-w-[120px] ml-2 shadow-lg shadow-primary/20"><Save className="w-4 h-4 mr-2" /> Save</Button>
            </div>
        </div>

        {/* SETTINGS */}
        <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3 px-6 pt-5">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <Settings className="w-4 h-4" /> Global Configuration
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-2">
                        <Label>Strategy Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BTC Breakout Strategy" className="bg-background" />
                    </div>
                    <div className="md:col-span-8 space-y-2">
                        <Label>Description</Label>
                        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. This strategy identifies breakout opportunities..." className="bg-background" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                        <Label>Schedule</Label>
                        <Select value={schedule} onValueChange={setSchedule}>
                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1m">1 Min</SelectItem>
                                <SelectItem value="5m">5 Min</SelectItem>
                                <SelectItem value="1h">1 Hour</SelectItem>
                                <SelectItem value="24h">Daily</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="md:col-span-6 space-y-2">
                        <Label>Assets</Label>
                        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] bg-background">
                            {assets.map(a => (
                                <Badge key={a} variant="secondary" className="gap-1 pl-2.5 py-1 text-xs">
                                    {a}
                                    <Trash2 className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => removeAsset(a)} />
                                </Badge>
                            ))}
                            <Select onValueChange={addAsset}>
                                <SelectTrigger className="w-[110px] h-6 border-none shadow-none text-xs text-muted-foreground"><SelectValue placeholder="+ Add Asset" /></SelectTrigger>
                                <SelectContent>{["BTC", "ETH", "SOL", "AVAX", "MATIC"].map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Notifications */}
                    <div className="md:col-span-12 space-y-2">
                        <Label>Notifications</Label>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 border rounded-md bg-background">
                            <div className="md:col-span-3 flex items-center gap-2">
                                <Checkbox
                                    checked={notificationPreferences?.cooldown?.enabled ?? false}
                                    onCheckedChange={(checked) => {
                                        setNotificationPreferences(prev => ({
                                            ...prev,
                                            cooldown: {
                                                enabled: !!checked,
                                                duration_value: prev.cooldown?.duration_value ?? 1,
                                                duration_unit: prev.cooldown?.duration_unit ?? "h",
                                            }
                                        }));
                                    }}
                                />
                                <span className="text-sm">Enable Cooldown</span>
                            </div>

                            {notificationPreferences?.cooldown?.enabled && (
                                <>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Duration Value</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={notificationPreferences.cooldown?.duration_value ?? 1}
                                            onChange={(e) =>
                                                setNotificationPreferences(prev => ({
                                                    ...prev,
                                                    cooldown: {
                                                        ...prev.cooldown,
                                                        duration_value: Number(e.target.value) || 0,
                                                    }
                                                }))
                                            }
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="md:col-span-3 space-y-2">
                                        <Label>Duration Unit</Label>
                                        <Select
                                            value={notificationPreferences.cooldown?.duration_unit ?? "h"}
                                            onValueChange={(v) =>
                                                setNotificationPreferences(prev => ({
                                                    ...prev,
                                                    cooldown: {
                                                        ...prev.cooldown,
                                                        duration_unit: v as NotificationPreferences["cooldown"]["duration_unit"],
                                                    }
                                                }))
                                            }
                                        >
                                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="s">Seconds</SelectItem>
                                                <SelectItem value="m">Minutes</SelectItem>
                                                <SelectItem value="h">Hours</SelectItem>
                                                <SelectItem value="d">Days</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* BUILDER CANVAS (SWITCHABLE) */}
        <div className="flex-1 min-h-[600px] border rounded-xl bg-slate-50/50 relative overflow-hidden shadow-inner">
             
             {viewMode === "visual" ? (
                <>
                    <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur p-3 rounded-lg border shadow-lg space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drag & Drop Nodes</p>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="justify-start h-9 text-xs font-medium" onClick={() => addConditionToGroup(logicTree.id!)}><Activity className="w-3.5 h-3.5 mr-2 text-blue-500" /> New Condition</Button>
                            <Button variant="outline" size="sm" className="justify-start h-9 text-xs font-medium" onClick={() => addGroupToGroup(logicTree.id!)}><GitBranch className="w-3.5 h-3.5 mr-2 text-purple-500" /> New Logic Group</Button>
                        </div>
                    </div>
                    <LogicTreeFlow 
                        conditions={conditions} logicTree={logicTree} 
                        onConditionsChange={setConditions} onLogicTreeChange={setLogicTree}
                        onAddConditionToGroup={addConditionToGroup} onAddGroupToGroup={addGroupToGroup}
                    />
                </>
             ) : (
                <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
                    <div className="mb-8 text-center space-y-1">
                        <h3 className="text-xl font-bold tracking-tight">Logic Tree Editor</h3>
                        <p className="text-sm text-muted-foreground">Define your strategy logic using a structured hierarchical list.</p>
                    </div>
                    <SimpleLogicTree 
                        node={logicTree}
                        conditions={conditions}
                        depth={0}
                        onUpdateGroup={handleUpdateGroup}
                        onRemoveGroup={(id: any) => setLogicTree({ ...logicTree, conditions: [] })} 
                        onAddCondition={addConditionToGroup}
                        onAddGroup={addGroupToGroup}
                        onUpdateCondition={handleUpdateCondition}
                        onRemoveCondition={handleRemoveCondition}
                    />
                </div>
             )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}