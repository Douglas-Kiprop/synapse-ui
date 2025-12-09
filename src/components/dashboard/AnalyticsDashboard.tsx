// src/components/dashboard/AnalyticsDashboard.tsx

import React, { useState } from "react";
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
import { LogicVisualizer } from "@/components/dashboard/LogicVisualizer"; // Make sure this path is correct

// --- MOCK DATA ---
// Replace with actual API fetches to your /internal/evaluate/{id} endpoint
const MOCK_EVALUATION_DATA = {
  met: true,
  details: {
    met: true,
    evaluated: {
      "10cacf91-bde8-4d8f": {
        met: true,
        value: 25.4582,
        details: { indicator: "MACD", operator: "gt", threshold: 19.0, asset: "ETH", interval: "1h" }
      },
      "54a8be34-0ebd-4311": {
        met: true,
        value: 57.9545,
        details: { indicator: "RSI", operator: "gt", threshold: 30.0, asset: "SOL", interval: "1h" }
      },
      "f047ef83-e6b9-4f48": {
        met: true,
        value: 3154.97,
        details: { asset: "BTC", direction: "below", target: 4000.0 }
      },
      "a9b2c3d4-e5f6-7g8h": {
        met: false,
        value: 1.05,
        details: { indicator: "ATR", operator: "lt", threshold: 1.0, asset: "AVAX", interval: "4h" }
      }
    }
  }
};

const TRIGGER_LOGS = [
  { id: "log-1", name: "BTC Institutional Sweep", time: "14:02:45", status: "TRIGGERED" },
  { id: "log-2", name: "ETH Momentum Alpha", time: "13:58:12", status: "TRIGGERED" },
  { id: "log-3", name: "SOL Breakout Test", time: "13:45:01", status: "HELD" },
  { id: "log-4", name: "AVAX Volatility", time: "13:30:55", status: "TRIGGERED" },
];


const AnalyticsDashboard: React.FC = () => {
  const [selectedLog, setSelectedLog] = useState<string | null>("log-1");
  const [loading, setLoading] = useState(false);

  // Simulate a data refresh
  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

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
          <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-emerald-500">Monitoring Service Online</span>
          </div>
        </div>
      </div>

      <hr className="border-border/50" />

      {/* KEY METRICS GRID (Based on your /metrics endpoint) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Active Strategies", value: "12", icon: Activity, trend: "Fetched from /metrics", color: "text-blue-500" },
          { title: "Total Trigger Logs", value: "843", icon: Zap, trend: "Fetched from /metrics", color: "text-amber-500" },
          { title: "Avg. Eval Latency", value: "45ms", icon: History, trend: "Next feature", color: "text-purple-500" },
          { title: "Trigger Success Rate", value: "68.5%", icon: CheckCircle2, trend: "Derived metric", color: "text-emerald-500" },
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
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                {TRIGGER_LOGS.map((log, i) => (
                    <div 
                        key={log.id}
                        onClick={() => setSelectedLog(log.id)}
                        className={`p-4 rounded-xl border transition-all duration-200 group
                            ${selectedLog === log.id 
                                ? 'bg-primary/10 border-primary shadow-lg shadow-primary/10' 
                                : 'bg-card border-border/50 hover:border-border hover:bg-accent/50'}
                        `}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-base">{log.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">{log.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                                log.status === 'TRIGGERED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                            }`}>
                                {log.status}
                            </span>
                            <span className="text-xs text-muted-foreground">Log ID: {log.id.split('-')[1]}...</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* RIGHT COLUMN: LOGIC VISUALIZER (The Auditable Decision Path) */}
        <div className="lg:col-span-2">
            <Card className="h-full bg-gradient-to-b from-card to-background border-border/50 shadow-2xl shadow-primary/10">
                <CardHeader className="border-b border-border/50 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="w-5 h-5 text-primary" />
                                Strategy Execution Trace
                            </CardTitle>
                            <CardDescription>Visualizing the verifiable logic tree for **{TRIGGER_LOGS.find(l => l.id === selectedLog)?.name || 'N/A'}**</CardDescription>
                        </div>
                        <div className="text-right">
                             <div className="text-xs font-mono text-muted-foreground">Block Height: 18,234,129</div>
                             <div className="text-xs font-mono text-emerald-400 font-bold">ON-CHAIN VERIFIABLE</div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {/* The God Level Component */}
                    <LogicVisualizer data={MOCK_EVALUATION_DATA} />
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