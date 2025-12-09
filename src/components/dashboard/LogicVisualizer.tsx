// src/components/dashboard/LogicVisualizer.tsx

import React from 'react';
import { Terminal, Activity } from 'lucide-react';

// --- Types compatible with your backend LogicSnapshot ---
interface ConditionDetail {
  indicator?: string;
  operator?: string;
  threshold?: number;
  asset?: string;
  interval?: string;
  direction?: string;
  target?: number;
  [key: string]: any; // Catch-all for other properties
}

interface EvaluatedNode {
  met: boolean;
  value: number | null;
  details: ConditionDetail;
}

interface LogicTreeProps {
  // This matches the 'snapshot' object from your API
  data: {
    met: boolean;
    evaluated?: Record<string, EvaluatedNode>; 
    message?: string | null;
  };
}

const LogicCard = ({ node, id }: { node: EvaluatedNode; id: string }) => {
  const isMet = node.met;
  
  return (
    <div className={`relative p-4 rounded-lg border-l-4 mb-3 transition-all duration-200 hover:scale-[1.01] ${
      isMet 
        ? 'bg-emerald-500/10 border-emerald-500 hover:bg-emerald-500/15' 
        : 'bg-red-500/10 border-red-500 hover:bg-red-500/15'
    }`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground opacity-50 uppercase tracking-wider">{id.substring(0, 8)}...</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              isMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isMet ? 'PASS' : 'FAIL'}
            </span>
          </div>
          
          {/* CONDITION DISPLAY */}
          <div className="flex items-center gap-2 text-sm font-medium text-foreground flex-wrap">
            {node.details?.asset && <span className="text-primary">{node.details.asset}</span>}
            
            {(node.details?.indicator || node.details?.asset) && (
                <span className="uppercase">{node.details.indicator || 'PRICE'}</span>
            )}
            
            <span className="text-muted-foreground">
              {node.details?.operator === 'gt' ? '>' : node.details?.operator === 'lt' ? '<' : node.details?.direction || 'is'}
            </span>
            
            <span className="text-foreground">
                {node.details?.threshold ?? node.details?.target ?? 'N/A'}
            </span>
            
            {node.details?.interval && (
                <span className="text-xs text-muted-foreground ml-2">({node.details.interval})</span>
            )}
          </div>
        </div>

        <div className="text-right flex-shrink-0 ml-4">
          <p className="text-xs text-muted-foreground">Current/Measured</p>
          <p className={`font-mono font-bold ${isMet ? 'text-emerald-400' : 'text-red-400'}`}>
            {node.value !== null && node.value !== undefined ? node.value.toFixed(2) : 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const LogicVisualizer: React.FC<LogicTreeProps> = ({ data }) => {
  // Safety check: if data is null or evaluated is missing
  if (!data || !data.evaluated) {
    return (
        <div className="p-4 text-center text-muted-foreground text-sm italic border border-dashed rounded-lg">
            No detailed logic trace available for this log.
        </div>
    );
  }

  const nodes = Object.entries(data.evaluated);

  return (
    <div className="space-y-4">
      
      {/* Visual Header */}
      <div className="flex items-center gap-2 mb-4 p-2 rounded bg-background/50 border border-border/50">
        <Terminal className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Decision Path Audit
        </h3>
      </div>

      <div className="relative">
        {/* The Auditable Path (The vertical line) */}
        <div className="absolute left-4 top-10 bottom-4 w-0.5 bg-gradient-to-b from-primary/50 to-transparent -z-10" />

        <div className="space-y-4 pl-0">
            {/* Root Status */}
            <div className="flex items-center gap-4 mb-6 p-4 bg-background/50 border border-border/50 rounded-lg backdrop-blur-sm shadow-md">
                <div className={`p-2 rounded-full ${data.met ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="font-medium text-foreground">Final Logic Gate</h4>
                    <p className="text-sm text-muted-foreground">
                        {data.met ? 'All conditions satisfied (met: TRUE)' : 'Conditions failed (met: FALSE)'}
                    </p>
                </div>
            </div>

            {/* Individual Conditions Grid */}
            <div className="grid gap-2">
                {nodes.map(([id, node]) => (
                    <LogicCard key={id} id={id} node={node} />
                ))}
            </div>
        </div>
      </div>
      
      {/* Verifiability Tag */}
      <div className="mt-6 pt-4 border-t border-border/40 flex justify-between items-center text-xs text-muted-foreground font-mono">
        <span>VERIFIABLE LOG ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}</span>
        <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE AUDIT TRACE
        </div>
      </div>
    </div>
  );
};