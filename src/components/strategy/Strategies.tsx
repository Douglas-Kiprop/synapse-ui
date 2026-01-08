import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStrategyService } from "@/services/strategyService";
import type { StrategyModel } from "@/types/strategy";
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Layers,
  Clock,
  TrendingUp,
  Pause,
  Play,
  Eye,
  RefreshCw,
  LayoutGrid,
  List,
  GanttChartSquare,
  Activity,
  CalendarClock,
  Zap,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// --- Type Extensions (For cleaner Status Rendering) ---

type StrategyStatus = StrategyModel["status"];

// --- Utility Components for Visual Polish ---

/**
 * A highly polished status badge with distinct colors.
 */
const StatusBadge: React.FC<{ status: StrategyStatus; className?: string }> = ({ status, className }) => {
  let colorClass = "";
  const text = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status) {
    case "active":
      colorClass = "bg-green-600/10 text-green-400 ring-green-500/30";
      break;
    case "paused":
      colorClass = "bg-yellow-600/10 text-yellow-400 ring-yellow-500/30";
      break;
    case "archived":
      colorClass = "bg-gray-600/10 text-gray-400 ring-gray-500/30";
      break;
    case "error":
      colorClass = "bg-red-600/10 text-red-400 ring-red-500/30";
      break;
    default:
      colorClass = "bg-blue-600/10 text-blue-400 ring-blue-500/30";
      break;
  }

  return (
    <Badge
      className={`font-semibold px-2 py-0.5 rounded-full ring-1 ${colorClass} ${className}`}
    >
      {text}
    </Badge>
  );
};

/**
 * A sleek, high-contrast, professional button for primary actions.
 */
const PrimaryActionButton: React.FC<{
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  label: string;
  Icon: React.ElementType;
  size?: "sm" | "default" | "icon" | "lg"; // Added size prop
}> = ({ onClick, disabled, loading, label, Icon, size = "sm" }) => (
  <Button
    size={size}
    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-all duration-200 whitespace-nowrap"
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading ? (
      <RefreshCw className={`w-4 h-4 ${size === 'sm' ? 'mr-2' : ''} animate-spin`} />
    ) : (
      <Icon className={`w-4 h-4 ${size === 'sm' ? 'mr-2' : ''}`} />
    )}
    {size !== 'icon' && label}
  </Button>
);

/**
 * Logic Viewer Modal - Polished, Dedicated Component
 * Using Dialog from Shadcn/UI for a clean, focused view.
 */
const StrategyLogicDialog: React.FC<{
  strategy: StrategyModel | null;
  onClose: () => void;
  LogicNodeRenderer: React.FC<any>; // Pass the renderer function
}> = ({ strategy, onClose, LogicNodeRenderer }) => {
  if (!strategy) return null;

  const conditionsById = useMemo(() => Object.fromEntries((strategy.conditions ?? []).map((c: any) => [String(c.id), c])), [strategy.conditions]);

  return (
    <Dialog open={!!strategy} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <GanttChartSquare className="w-6 h-6 text-blue-500" />
            {strategy.name} — Logic Tree
          </DialogTitle>
        </DialogHeader>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-h-[70vh] overflow-hidden">
          {/* Logic Tree (3/5 width) */}
          <div className="lg:col-span-3">
            <h4 className="text-sm font-medium mb-3 uppercase text-muted-foreground tracking-wider">Visual Logic Flow</h4>
            <div className="p-4 rounded-xl border border-border/50 bg-background/20 max-h-[60vh] overflow-y-auto shadow-inner">
              {strategy.logic_tree ? (
                <LogicNodeRenderer node={strategy.logic_tree} conditionsById={conditionsById} />
              ) : (
                <div className="text-center py-10 text-muted-foreground">No logic tree defined.</div>
              )}
            </div>
          </div>

          {/* Conditions List (2/5 width) */}
          <div className="lg:col-span-2">
            <h4 className="text-sm font-medium mb-3 uppercase text-muted-foreground tracking-wider">All Conditions ({strategy.conditions?.length ?? 0})</h4>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {(strategy.conditions ?? []).map((c: any) => (
                <div key={String(c.id)} className="p-3 border border-border/50 rounded-lg bg-card hover:bg-card/70 transition-colors">
                  <div className="text-sm font-semibold">{c.label ?? c.type}</div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">ID: {String(c.id)}</div>
                  <pre className="text-xs mt-2 bg-background/20 rounded-md p-2 overflow-auto max-h-20">{JSON.stringify(c.payload, null, 2)}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
};


// --- Main Strategies Component ---

export default function Strategies() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { listStrategies, deleteStrategy, updateStrategy } = useStrategyService();

  const [loading, setLoading] = useState<boolean>(true);
  const [strategies, setStrategies] = useState<StrategyModel[]>([]);
  const [query, setQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "name" | "last_run" | "triggered" | "status"
  >("name");

  // Changed to "list" for table mode to align with user's terminology
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid"); 

  // Logic viewer state
  const [viewingLogic, setViewingLogic] = useState<StrategyModel | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Refetch function, memoized to avoid recreation on every render
  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listStrategies();
      setStrategies(data);
    } catch (err: any) {
      toast({
        title: "Unable to refresh strategies",
        description: err?.message ?? "Unexpected error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [listStrategies, toast]);

  // fetch strategies only once on mount (empty deps to prevent re-fetch loop)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listStrategies();
        if (!mounted) return;
        setStrategies(data);
      } catch (err: any) {
        if (mounted) {
          toast({
            title: "Unable to load strategies",
            description: err?.message ?? "Unexpected error",
            variant: "destructive",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []); // Empty deps: runs only once on mount

  // filtered + sorted list
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let data = strategies;
    if (q) {
      data = data.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q) ||
        (s.assets ?? []).join(" ").toLowerCase().includes(q)
      );
    }

    // Modern sorting logic: nulls/undefineds go to the end for dates/numbers
    const by = (a: any, b: any, isAscending = false) => {
      if (a == null && b == null) return 0;
      if (a == null) return 1; // Null/undefined goes to the end
      if (b == null) return -1; // Null/undefined goes to the end

      if (isAscending) {
        if (a > b) return 1;
        if (a < b) return -1;
      } else {
        if (a > b) return -1;
        if (a < b) return 1;
      }
      return 0;
    };

    switch (sortBy) {
      case "last_run":
        return [...data].sort((a, b) => by(a.last_run_at, b.last_run_at, false)); // Newest first (descending)
      case "triggered":
        return [...data].sort((a, b) => by(a.trigger_count ?? 0, b.trigger_count ?? 0, false)); // Highest count first (descending)
      case "status":
        return [...data].sort((a, b) => a.status.localeCompare(b.status)); // Alphabetical
      case "name":
      default:
        return [...data].sort((a, b) => a.name.localeCompare(b.name)); // Alphabetical
    }
  }, [strategies, query, sortBy]);

  // navigation
  const openNew = () => navigate("/strategy-builder");
  const editStrategy = (s?: StrategyModel) => navigate("/strategy-builder", { state: { strategy: s } });

  // update status (pause/resume)
  const setStrategyStatus = async (s: StrategyModel, status: StrategyModel["status"]) => {
    setActionLoading((p) => ({ ...p, [s.id]: true }));
    try {
      await updateStrategy(String(s.id), { status });
      setStrategies((prev) => prev.map((x) => (x.id === s.id ? { ...x, status } : x)));
      toast({ title: `Strategy ${status.charAt(0).toUpperCase() + status.slice(1)}`, description: `"${s.name}" is now ${status}.` });
    } catch (err: any) {
      toast({ title: "Failed to update", description: err?.message ?? "Unexpected error", variant: "destructive" });
    } finally {
      setActionLoading((p) => ({ ...p, [s.id]: false }));
    }
  };

  // delete
  const handleDelete = async (s: StrategyModel) => {
    if (!confirm(`Delete strategy "${s.name}"? This action cannot be undone.`)) return;
    setActionLoading((p) => ({ ...p, [s.id]: true }));
    try {
      await deleteStrategy(String(s.id));
      setStrategies((prev) => prev.filter((x) => x.id !== s.id));
      toast({ title: "Deleted Strategy", description: `"${s.name}" removed successfully.` });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message ?? "Unexpected error", variant: "destructive" });
    } finally {
      setActionLoading((p) => ({ ...p, [s.id]: false }));
    }
  };

  // Run / Evaluate NOW (optimistic - replace with real backend call if available)
  const handleRunNow = async (s: StrategyModel) => {
    setActionLoading((p) => ({ ...p, [s.id]: true }));
    try {
      // optimistic: set last_run_at locally
      const now = new Date().toISOString();
      setStrategies((prev) => prev.map(x => x.id === s.id ? { ...x, last_run_at: now } : x));

      // Try to update backend's last_run_at (placeholder)
      await updateStrategy(String(s.id), { last_run_at: now });

      toast({ title: "Run Requested", description: `Strategy "${s.name}" evaluation requested. Check execution logs soon.` });
    } catch (err: any) {
      toast({ title: "Run failed", description: err?.message ?? "Unexpected error", variant: "destructive" });
    } finally {
      setActionLoading((p) => ({ ...p, [s.id]: false }));
    }
  };

  // small helpers
  const prettyDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' }) + " " + d.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' });
  };
  
  // Visual logic tree renderer (improved style)
  const LogicNodeRenderer: React.FC<{
    node: any;
    conditionsById: Record<string, any>;
    depth?: number;
  }> = ({ node, conditionsById, depth = 0 }) => {
    if (!node) return null;
    const operator = node.operator ?? "AND";
    const isAnd = operator === "AND";
    const isRoot = depth === 0;

    return (
      <div className={`${isRoot ? "" : "relative ml-4 pl-4"} border-l border-border/50`}>
        {/* Logic Operator Pill */}
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap -ml-[1.5rem] mb-3 ${isAnd ? "bg-green-600/20 text-green-400" : "bg-blue-600/20 text-blue-400"}`}>
          {operator.toUpperCase()}
        </div>

        <div className="mt-1 grid gap-3">
          {(node.conditions || []).map((item: any, idx: number) => {
            if (item && typeof item === "object" && "ref" in item) {
              const cond = conditionsById[String(item.ref)];
              if (!cond) {
                return (
                  <div key={idx} className="p-3 rounded-lg border border-red-700 text-xs text-red-300 bg-red-900/10 shadow-sm">
                    ⚠️ Missing condition (Ref: {String(item.ref)})
                  </div>
                );
              }
              const label = cond.label || cond.type || "Condition";
              const summary = (() => {
                const keys = ["indicator", "asset", "operator", "value", "direction", "threshold", "type"];
                const parts: string[] = [];
                for (const k of keys) {
                  if (cond.payload && cond.payload[k] !== undefined && cond.payload[k] !== null) {
                    let val = String(cond.payload[k]);
                    // Truncate long strings for summary
                    if (val.length > 20) val = val.substring(0, 17) + "...";
                    parts.push(val);
                  }
                }
                return parts.join(" • ");
              })();

              return (
                <div key={idx} className="flex flex-col gap-1 p-3 rounded-lg border border-border/40 bg-background/10 hover:bg-background/20 transition-colors shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="text-sm font-semibold">{label}</div>
                    <Badge variant="outline" className="text-xs">{cond.type}</Badge>
                  </div>
                  {summary && <div className="text-xs text-muted-foreground truncate">{summary}</div>}
                </div>
              );
            } else {
              // Nested Logic Node
              return (
                <div key={idx} className="pb-1">
                  <LogicNodeRenderer node={item} conditionsById={conditionsById} depth={depth + 1} />
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };
  
  // Card layout renderer for grid view (Highly redesigned)
  const StrategyCard: React.FC<{ s: StrategyModel }> = ({ s }) => {
    const isActive = s.status === "active";
    const isLoading = !!actionLoading[s.id];

    return (
      <Card className="bg-card/70 backdrop-blur-sm border-border/50 shadow-lg rounded-xl transition-all duration-300 hover:shadow-2xl hover:border-blue-500/50">
        {/* Header: Name, Description, Status */}
        <CardHeader className="p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold truncate pr-4">{s.name}</CardTitle>
            <StatusBadge status={s.status} className="flex-shrink-0" />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">{s.description ?? "No description provided."}</p>
        </CardHeader>

        <Separator className="bg-border/50" />

        {/* Content: Key Metrics */}
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border-r border-border/50 pr-2">
              <div className="text-2xl font-extrabold text-foreground">{s.conditions?.length ?? (s.conditions?.length ?? 0)}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><GanttChartSquare className="w-3 h-3"/> Conditions</div>
            </div>
            <div className="border-r border-border/50 pr-2">
              <div className="text-2xl font-extrabold text-foreground">{s.trigger_count ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><Activity className="w-3 h-3"/> Triggers</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-foreground">{s.schedule ?? "—"}</div>
              {/* FIX 2: Replaced Cadence with Schedule */}
              <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><CalendarClock className="w-3 h-3"/> Schedule</div>
            </div>
          </div>
          
          <Separator className="bg-border/50" />

          {/* Assets and Last Run */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Assets ({s.assets?.length ?? 0})</div>
            <div className="flex flex-wrap gap-1.5 min-h-[24px]">
              {s.assets?.slice(0, 4).map((a) => (
                <Badge key={a} className="text-xs px-2 py-0.5 bg-blue-600/10 text-blue-400 font-semibold border-blue-600/30 border">{a}</Badge>
              ))}
              {s.assets && s.assets.length > 4 && <Badge variant="secondary" className="text-xs bg-gray-600/10 text-gray-400">+{s.assets.length - 4}</Badge>}
              {(!s.assets || s.assets.length === 0) && <span className="text-xs text-gray-500">— None</span>}
            </div>

            <div className="text-xs text-muted-foreground pt-1 flex justify-between items-center">
              <div>Last run:</div>
              <div className="font-semibold text-foreground">{prettyDate(s.last_run_at ?? undefined)}</div>
            </div>
          </div>
        </CardContent>

        <Separator className="bg-border/50" />

        {/* Footer: Actions */}
        {/* FIX 1: Adjusted action button sizes and container to prevent overflow */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button size="icon" variant="ghost" onClick={() => editStrategy(s)} title="Edit" disabled={isLoading} className="h-8 w-8">
              <Pencil className="w-4 h-4 text-gray-400 hover:text-blue-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => handleDelete(s)} title="Delete" disabled={isLoading} className="h-8 w-8">
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </Button>
            <Button size="icon" variant="ghost" onClick={() => setViewingLogic(s)} title="View Logic" disabled={isLoading} className="h-8 w-8">
              <Eye className="w-4 h-4 text-gray-400 hover:text-purple-500" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* Compact Pause/Resume toggle */}
            <Button 
              size="sm" 
              variant={isActive ? "outline" : "default"} 
              className={`w-20 text-xs px-2 ${isActive ? "text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10" : "bg-green-600 hover:bg-green-700 text-white"}`}
              onClick={() => setStrategyStatus(s, isActive ? "paused" : "active")} 
              disabled={isLoading}
              title={isActive ? "Pause Strategy" : "Resume Strategy"}
            >
              {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : isActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
              {isActive ? 'Pause' : 'Play'}
            </Button>
            
            {/* Primary Run button */}
            <PrimaryActionButton 
              onClick={() => handleRunNow(s)} 
              disabled={isLoading}
              loading={isLoading}
              label="Run"
              Icon={Zap}
              size="sm"
            />
          </div>
        </div>
      </Card>
    );
  };

  // Table view row (Redesigned for density and professionalism)
  const TableView = () => {
    // FIX 4: Added max-h-screen and overflow-y-auto to allow scrolling *within* the table view
    // without overflowing the header above (assuming a fixed header).
    return (
      <div className="overflow-auto rounded-xl border border-border/50 shadow-xl max-h-[70vh]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-background/80 backdrop-blur-sm sticky top-0 z-10 border-b border-border/50">
            <tr>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-1/4">Strategy Name</th>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-[100px]">Schedule</th>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-[150px]">Assets</th>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-[80px]">Conditions</th>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-[150px]">Last Run</th>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-[80px]">Triggers</th>
              <th className="p-4 text-sm font-semibold text-muted-foreground w-[80px]">Status</th>
              <th className="p-4 text-sm font-semibold text-right w-[240px]">Actions</th> 
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const isLoading = !!actionLoading[s.id];
              const isActive = s.status === "active";
              return (
                <tr key={s.id} className="border-t border-border/20 hover:bg-background/5 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-base text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{s.description ?? "—"}</div>
                  </td>
                  {/* FIX 2: Schedule column */}
                  <td className="p-4 text-sm text-muted-foreground font-medium">{s.schedule ?? "—"}</td> 
                  <td className="p-4 text-sm text-foreground">
                    <div className="flex flex-wrap gap-1">
                      {(s.assets || []).slice(0, 3).map(a => <Badge key={a} variant="outline" className="text-xs bg-gray-700/10">{a}</Badge>)}
                      {(s.assets || []).length > 3 && <Badge variant="secondary" className="text-xs">+{s.assets!.length - 3}</Badge>}
                      {(!s.assets || s.assets.length === 0) && "—"}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-foreground font-semibold">{s.conditions?.length ?? (s.conditions?.length ?? 0)}</td>
                  <td className="p-4 text-sm text-foreground font-medium">{prettyDate(s.last_run_at ?? undefined)}</td>
                  <td className="p-4 text-sm text-foreground font-semibold">{s.trigger_count ?? 0}</td>
                  <td className="p-4 text-sm"><StatusBadge status={s.status} /></td>
                  <td className="p-4 text-right">
                    {/* FIX 1 & 3: Adjusted spacing and added Delete button */}
                    <div className="flex items-center justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setViewingLogic(s)} title="View Logic" disabled={isLoading} className="h-8 w-8"><Eye className="w-4 h-4 text-purple-500" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => editStrategy(s)} title="Edit" disabled={isLoading} className="h-8 w-8"><Pencil className="w-4 h-4 text-blue-500" /></Button>
                      {/* FIX 3: Delete button now present in list mode */}
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(s)} title="Delete" disabled={isLoading} className="h-8 w-8">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                      <Button size="sm" variant="outline" 
                        onClick={() => setStrategyStatus(s, isActive ? "paused" : "active")} 
                        disabled={isLoading}
                        className={`w-16 text-xs px-2 ${isActive ? "text-yellow-500 border-yellow-500/50 hover:bg-yellow-500/10" : "text-green-500 border-green-500/50 hover:bg-green-500/10"}`}
                      >
                        {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : isActive ? "Pause" : "Resume"}
                      </Button>
                      <PrimaryActionButton 
                        onClick={() => handleRunNow(s)} 
                        disabled={isLoading}
                        loading={isLoading}
                        label="Run"
                        Icon={Zap}
                        size="sm"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Main Render
  return (
    // FIX 4: Added a large top padding to prevent the content from scrolling under a fixed header
    <div className="space-y-8 p-6 lg:p-10 pt-20"> 
      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-foreground">Strategy Management</h1>
            <p className="text-lg text-muted-foreground mt-1">Monitor and iterate on your rule-based trading strategies.</p>
            <div className="flex gap-6 mt-3 text-sm text-muted-foreground">
              {/* FIX 2: Changed to Schedule-based evaluation for consistency with requested text */}
              <div className="flex items-center gap-2 font-medium text-purple-400">
                <Clock className="w-4 h-4" /> Schedule-based evaluation
              </div>
              <div className="flex items-center gap-2 font-medium text-green-400">
                <TrendingUp className="w-4 h-4" /> Total Triggers: <span className="text-lg font-bold text-foreground ml-1">{strategies.reduce((acc, s) => acc + (s.trigger_count ?? 0), 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={refetch}
            title="Refresh Strategies"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button onClick={openNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-xl shadow-blue-500/20 transition-all duration-300">
            <Plus className="w-5 h-5 mr-2" /> Create New Strategy
          </Button>
        </div>
      </div>

      <Separator className="bg-border/30" />

      {/* --- TOOLBAR --- */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:max-w-lg">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search strategies by name, asset, or description..." 
            className="pl-10 h-10 rounded-xl border-border/50 bg-background/50 focus-visible:ring-blue-500" 
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center border border-border/50 rounded-xl p-1 bg-background/50">
            <button 
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-muted-foreground hover:bg-background/20"}`} 
              onClick={() => setViewMode("grid")} 
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-muted-foreground hover:bg-background/20"}`} 
              onClick={() => setViewMode("list")} // Changed "table" to "list" to match user request
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-44 h-10 rounded-xl border-border/50 bg-background/50">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="name"><span className="font-medium">Name</span> (A → Z)</SelectItem>
                <SelectItem value="last_run"><span className="font-medium">Last Run</span> (Newest)</SelectItem>
                <SelectItem value="triggered"><span className="font-medium">Trigger Count</span> (Highest)</SelectItem>
                <SelectItem value="status"><span className="font-medium">Status</span> (Active First)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="animate-pulse rounded-xl p-4 bg-background/30 h-[26rem] shadow-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-card/70 border-border/50 shadow-2xl rounded-xl">
          <CardContent className="py-16 text-center">
            <TrendingUp className="w-16 h-16 mx-auto text-blue-500/70" />
            <h2 className="text-2xl font-bold mt-6">No Strategies Found</h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto">It looks like you haven't created any strategies yet, or your search didn't match any results. Start building your rule-set now!</p>
            <div className="mt-8 flex justify-center">
              <Button onClick={openNew} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-xl shadow-blue-500/30">
                <Plus className="w-4 h-4 mr-2" /> Start Creating
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "list" ? (
        <TableView />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map((s) => <StrategyCard key={s.id} s={s} />)}
        </div>
      )}

      {/* --- LOGIC VIEWER DIALOG --- */}
      <StrategyLogicDialog 
        strategy={viewingLogic} 
        onClose={() => setViewingLogic(null)} 
        LogicNodeRenderer={LogicNodeRenderer}
      />

    </div>
  );
}