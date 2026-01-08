import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, Save, Undo2, Redo2, Network, ListTree, Activity, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useStrategyService } from "@/services/strategyService";
import { ReactFlowProvider } from "reactflow";

// Imported Types & Modules from Builder
import { 
    BaseCondition, 
    LogicNodeGroup, 
    StrategyModel, 
    ConditionType, 
    UUID, 
    LogicNodeRef 
} from "@/types/builder";
import { 
    uid, 
    normalizeLogicTree, 
    ensureGroupHasId, 
    updateGroupInTree, 
    removeRefFromTree 
} from "@/lib/builderutils";
import  useHistory  from "@/hooks/useHistory";
import LogicTreeFlow  from "./builder/VisualFlow";
import  SimpleLogicTree  from "./builder/SimpleTree";
import GlobalSettings from "./builder/GlobalSettings";

// API Types
import type { StrategyModel as ApiStrategyModel, StrategyCreatePayload, NotificationPreferences, BaseCondition as ApiBaseCondition, LogicNodeGroup as ApiLogicNodeGroup } from "@/types/strategy";

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
    cooldown: { enabled: false, duration_value: 1, duration_unit: "h" }
  });
  
  const addAsset = (a: string) => { if(!assets.includes(a)) setAssets([...assets, a]); };
  const removeAsset = (a: string) => setAssets(assets.filter(x => x !== a));

  // -- Logic Actions --
  const createEmptyCondition = (type: ConditionType = "technical_indicator"): BaseCondition => {
    const base = { id: uid(), type, label: "", enabled: true };
    switch (type) {
      case "technical_indicator":
        return { ...base, payload: { indicator: "rsi", params: { period: 14 }, operator: "lt", value: 30, asset: "BTC", timeframe: "1h" } };
      case "wallet_flow":
        return { ...base, payload: { direction: "inflow", entity_type: "address", address: "", label: "Smart Money", asset: "ETH", value: 100000 } };
      case "exchange_flow":
        return { ...base, payload: { flow_type: "net_flow", exchange: "binance", asset: "BTC", value: 1000 } };
      default:
        return { ...base, payload: {} };
    }
  };

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

  // Save Strategy Logic
  const sanitizeConditionPayload = (condition: BaseCondition): BaseCondition => {
    const baseCondition = { ...condition };
    let sanitizedPayload: Record<string, any> = {};

    switch (baseCondition.type) {
      case "technical_indicator":
        sanitizedPayload = {
          indicator: baseCondition.payload?.indicator ?? "rsi",
          operator: baseCondition.payload?.operator ?? "lt",
          value: baseCondition.payload?.value ?? 30,
          timeframe: baseCondition.payload?.timeframe ?? "1h",
          asset: baseCondition.payload?.asset ?? assets[0] ?? "BTC",
        };
        break;
      case "price_alert":
        sanitizedPayload = {
          asset: baseCondition.payload?.asset ?? "",
          direction: baseCondition.payload?.direction ?? "above",
          target_price: baseCondition.payload?.target_price ?? 0,
        };
        break;
      case "volume_alert":
        sanitizedPayload = {
          asset: baseCondition.payload?.asset ?? "",
          timeframe: baseCondition.payload?.timeframe ?? "1h",
          operator: baseCondition.payload?.operator ?? "gt",
          threshold: baseCondition.payload?.threshold ?? 0,
        };
        break;
      case "wallet_flow":
        sanitizedPayload = {
          direction: baseCondition.payload?.direction ?? "inflow",
          entity_type: baseCondition.payload?.entity_type ?? "address",
          address: baseCondition.payload?.address ?? "",
          label: baseCondition.payload?.label ?? "Whale",
          asset: baseCondition.payload?.asset ?? "ETH",
          value: Number(baseCondition.payload?.value) || 0,
        };
        break;
      case "exchange_flow":
        sanitizedPayload = {
          flow_type: baseCondition.payload?.flow_type ?? "net_flow",
          exchange: baseCondition.payload?.exchange ?? "binance",
          asset: baseCondition.payload?.asset ?? "BTC",
          value: Number(baseCondition.payload?.value) || 0,
        };
        break;
      case "custom":
      default:
        sanitizedPayload = baseCondition.payload || {};
        break;
    }
    return { ...baseCondition, payload: sanitizedPayload };
  };

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
        const sanitizedConditions = conditions.map(sanitizeConditionPayload);
        const payload: StrategyCreatePayload = {
            name,
            description,
            schedule,
            assets,
            conditions: sanitizedConditions as unknown as ApiBaseCondition[],
            logic_tree: stripGroupIds(logicTree),
            notification_preferences: notificationPreferences,
            status: initial?.status ?? "active",
        };
        
        const result = initial?.id
            ? await updateStrategy(initial.id, payload)
            : await createStrategy(payload);

        onSave?.(result);
        toast({ title: "Success", description: "Strategy saved successfully." });
    } catch (e: any) {
        console.error("Backend error body:", e.data);
        toast({
          title: "Failed",
          description: `Error: ${e.status || "Unknown"} - ${e.data || e.message || "An unexpected error occurred."}`,
          variant: "destructive",
        });
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

        {/* SETTINGS CARD */}
        <GlobalSettings 
            name={name} setName={setName}
            description={description} setDescription={setDescription}
            schedule={schedule} setSchedule={setSchedule}
            assets={assets} addAsset={addAsset} removeAsset={removeAsset}
            notificationPreferences={notificationPreferences} setNotificationPreferences={setNotificationPreferences}
        />

        {/* BUILDER CANVAS */}
        <div className="flex-1 min-h-[600px] border rounded-xl bg-slate-50/50 relative overflow-hidden shadow-inner">
             
             {viewMode === "visual" ? (
                <>
                    <div className="absolute top-4 left-4 z-10 bg-background/90 backdrop-blur p-3 rounded-lg border shadow-lg space-y-3">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Drag & Drop Nodes</p>
                        <div className="flex flex-col gap-2">
                            <Button variant="outline" size="sm" className="justify-start h-9 text-xs font-medium" onClick={() => addConditionToGroup(logicTree.id!)}><Activity className="w-3.5 h-3.5 mr-2 text-blue-500" /> New Technical Condition</Button>
                            <Button variant="outline" size="sm" className="justify-start h-9 text-xs font-medium" onClick={() => {
                              const newCond = createEmptyCondition("wallet_flow");
                              setConditions((prev) => [...prev, newCond]);
                              setLogicTree((prev) => {
                                const cloned = JSON.parse(JSON.stringify(prev));
                                cloned.conditions.push({ ref: newCond.id });
                                return cloned;
                              });
                            }}><Activity className="w-3.5 h-3.5 mr-2 text-indigo-500" /> New Wallet Flow</Button>
                            <Button variant="outline" size="sm" className="justify-start h-9 text-xs font-medium" onClick={() => {
                              const newCond = createEmptyCondition("exchange_flow");
                              setConditions((prev) => [...prev, newCond]);
                              setLogicTree((prev) => {
                                const cloned = JSON.parse(JSON.stringify(prev));
                                cloned.conditions.push({ ref: newCond.id });
                                return cloned;
                              });
                            }}><Activity className="w-3.5 h-3.5 mr-2 text-orange-500" /> New Exchange Flow</Button>
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
                        availableAssets={assets}
                    />
                </div>
             )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}