// src/components/dashboard/AnalyticsDashboard.tsx

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3, 
  Activity, 
  Zap, 
  History, 
  Filter, 
  RefreshCcw,
  CheckCircle2,
  Search,
  BookOpen
} from "lucide-react";
import { LogicVisualizer } from "@/components/dashboard/LogicVisualizer"; 
import { useMonitoringService, StrategyTriggerLog, TriggerLogRaw } from "@/services/monitoringService";

const AnalyticsDashboard: React.FC = () => {
  const { fetchHealth, fetchStrategies, fetchTriggerLogs, fetchMetrics } = useMonitoringService();
  
  // --- STATE ---
  const [logs, setLogs] = useState<StrategyTriggerLog[]>([]);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({ active: 0, total: 0 });
  
  const [loading, setLoading] = useState(false);
  const [isMonitoringServiceOnline, setIsMonitoringServiceOnline] = useState<boolean | null>(null);

  // --- DERIVED STATE ---
  // Find the full log object based on the selected ID
  const selectedLogData = useMemo(() => 
    logs.find(l => l.id === selectedLogId), 
    [logs, selectedLogId]
  );

  // Calculate success rate on the client side based on loaded logs
  const successRate = useMemo(() => {
    if (logs.length === 0) return "0.0%";
    const triggeredCount = logs.filter(l => l.status === "TRIGGERED").length;
    return `${((triggeredCount / logs.length) * 100).toFixed(1)}%`;
  }, [logs]);

  // --- DATA FETCHING ---
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // 1. Check Health
      const online = await fetchHealth();
      setIsMonitoringServiceOnline(online);

      // 2. Fetch Strategies (To map ID -> Name)
      const strategiesData = await fetchStrategies();
      
      // 3. Fetch Metrics
      const metricsData = await fetchMetrics();
      setMetrics({
        active: metricsData.active_strategies,
        total: metricsData.total_trigger_logs
      });

      // 4. Fetch Logs and Transform
      const rawLogs = await fetchTriggerLogs();
      
      // We need to merge the raw log (which has strategy_id) with the strategy list (which has name)
      const formattedLogs: StrategyTriggerLog[] = rawLogs.map((log: TriggerLogRaw) => {
        const strategy = strategiesData.find(s => s.id === log.strategy_id);
        
        return {
          id: log.id,
          name: strategy ? strategy.name : "Unknown Strategy", // Handle cases where strategy might be deleted
          time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          status: log.snapshot.met ? "TRIGGERED" : "HELD",
          rawSnapshot: log.snapshot // Store the raw snapshot for the Visualizer
        };
      });

      // Reverse to show newest first
      const sortedLogs = formattedLogs.reverse(); 

      setLogs(sortedLogs);
      
      // Auto-select the most recent log if nothing is selected
      if (sortedLogs.length > 0 && !selectedLogId) {
        setSelectedLogId(sortedLogs[0].id);
      } else if (sortedLogs.length > 0 && selectedLogId) {
         // Ensure selection is still valid after refresh
         const exists = sortedLogs.find(l => l.id === selectedLogId);
         if (!exists) setSelectedLogId(sortedLogs[0].id);
      }

    } catch (error) {
      console.error("Failed to fetch data:", error);
      setIsMonitoringServiceOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="min-h-full bg-background text-foreground space-y-8 p-0">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Strategy Forensics & Analytics
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Verifiable and auditable decision paths for every strategy execution.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="p-2 rounded-full bg-secondary hover:bg-secondary/80 transition-colors border border-border/50"
            disabled={loading}
          >
            <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
            isMonitoringServiceOnline === true ? 'bg-emerald-500/10 border-emerald-500/20' : 
            isMonitoringServiceOnline === false ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-500/10 border-gray-500/20'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isMonitoringServiceOnline === true ? 'bg-emerald-500 animate-pulse' : 
              isMonitoringServiceOnline === false ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className={`text-sm font-medium ${
              isMonitoringServiceOnline === true ? 'text-emerald-500' : 
              isMonitoringServiceOnline === false ? 'text-red-500' : 'text-gray-500'
            }`}>
              {isMonitoringServiceOnline === true ? 'Monitoring Service Online' : 
               isMonitoringServiceOnline === false ? 'Monitoring Service Offline' : 'Checking Status...'}
            </span>
          </div>
        </div>
      </div>

      <hr className="border-border/50" />

      {/* KEY METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Active Strategies", value: metrics.active, icon: Activity, trend: "Fetched from /strategies", color: "text-blue-500" },
          { title: "Total Trigger Logs", value: metrics.total, icon: Zap, trend: "Fetched from /metrics", color: "text-amber-500" },
          { title: "Avg. Eval Latency", value: "45ms", icon: History, trend: "Calculated (Mock)", color: "text-purple-500" },
          { title: "Trigger Success Rate", value: successRate, icon: CheckCircle2, trend: "Derived from logs", color: "text-emerald-500" },
        ].map((stat, i) => (
          <Card key={i} className="bg-gradient-to-br from-card to-card/50 border-border/50 shadow-md hover:border-primary/50 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <hr className="border-border/50" />

      {/* MAIN CONTENT SPLIT: TRIGGER FEED & LOGIC VISUALIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: TRIGGER FEED */}
        <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold flex items-center gap-2"><BookOpen className="w-5 h-5"/> Live Trigger Feed</h3>
                <Filter className="w-4 h-4 text-muted-foreground cursor-pointer hover:text-primary" />
            </div>
            
            {/* The Scrollable Feed */}
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 && !loading && (
                    <div className="text-center py-10 text-muted-foreground border border-dashed rounded-xl">
                        No logs found.
                    </div>
                )}
                
                {logs.map((log) => (
                    <div 
                        key={log.id}
                        onClick={() => setSelectedLogId(log.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 group cursor-pointer
                            ${selectedLogId === log.id 
                                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                                : 'bg-card border-border/50 hover:border-border hover:bg-accent/50'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-base truncate pr-2">{log.name}</span>
                            <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{log.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                log.status === 'TRIGGERED' ? 'bg-emerald-500/10 text-emerald-500' : 
                                log.status === 'HELD' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-red-500/10 text-red-500'
                            }`}>
                                {log.status}
                            </span>
                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                Log ID: {log.id.split('-')[0]}...
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT COLUMN: LOGIC VISUALIZER */}
        <div className="lg:col-span-2">
            <Card className="h-full bg-gradient-to-b from-card to-background border-border/50 shadow-2xl shadow-primary/10">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Strategy Execution Trace
                            </CardTitle>
                            <CardDescription>
                                {selectedLogData 
                                    ? `Visualizing the verifiable logic tree for **${selectedLogData.name}**`
                                    : "Select a log entry to visualize execution logic"
                                }
                            </CardDescription>
                        </div>
                        {selectedLogData && (
                            <div className="text-right hidden sm:block">
                                 <div className="text-xs font-mono text-muted-foreground">ID: {selectedLogData.id.split('-')[0]}</div>
                                 <div className="text-xs font-mono text-emerald-400 font-bold">ON-CHAIN VERIFIABLE</div>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {selectedLogData ? (
                        <LogicVisualizer data={selectedLogData.rawSnapshot} />
                    ) : (
                        <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
                            <Activity className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a trigger event from the feed to inspect its logic.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

      </div>

      <hr className="border-border/50" />
      
      {/* BACKTESTING SECTION (Future expansion) */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Backtesting Engine (Next Phase)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            A comprehensive backtesting service will be integrated here, allowing users to run their custom strategies against historical data. Results will leverage the same **Verifiable Decision Path Audit** system above to prove performance.
          </p>
        </CardContent>
      </Card>
      
    </div>
  );
};

export default AnalyticsDashboard;