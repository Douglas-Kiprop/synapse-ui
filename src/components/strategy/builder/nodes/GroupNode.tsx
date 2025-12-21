import React from "react";
import { Handle, Position } from "reactflow";
import { Trash2, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { GroupNodeData, LogicOperator } from "@/types/builder";

export const GroupNode: React.FC<{ data: GroupNodeData; selected?: boolean }> = ({ data, selected }) => {
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
            <Button variant="secondary" size="sm" className="flex-1 h-7 text-xs shadow-sm bg-background hover:bg-background/80" onClick={() => onAddCondition(group.id!)}><Plus className="w-3 h-3 mr-1" /> Cond</Button>
            <Button variant="secondary" size="sm" className="flex-1 h-7 text-xs shadow-sm bg-background hover:bg-background/80" onClick={() => onAddGroup(group.id!)}><Plus className="w-3 h-3 mr-1" /> Group</Button>
       </div>
       <Handle type="source" position={Position.Bottom} className="!bg-purple-500 !w-4 !h-4" />
    </div>
  );
};

export default GroupNode