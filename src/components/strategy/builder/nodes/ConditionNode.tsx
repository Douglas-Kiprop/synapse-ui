import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { Trash2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { ConditionNodeData } from "@/types/builder";
import { getPreviewData, getPreviewSummary } from "@/lib/builderutils";

export const ConditionNode: React.FC<{ data: ConditionNodeData; selected?: boolean }> = ({ data, selected }) => {
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


export default ConditionNode