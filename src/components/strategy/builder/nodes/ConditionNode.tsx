import React, { useState } from "react";
import { Handle, Position } from "reactflow";
import { Trash2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { ConditionNodeData, LogicOperator, BaseCondition } from "@/types/builder";
import { getPreviewData, getPreviewSummary } from "@/lib/builderutils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TIER_1_EXCHANGES = ["binance", "coinbase", "okx", "kraken", "bybit"];

export const ConditionNode: React.FC<{ data: ConditionNodeData; selected?: boolean }> = ({ data, selected }) => {
  const [editing, setEditing] = useState(false);
  const { condition, onRemove, onUpdate } = data;

  const updatePayload = (key: string, value: any) => {
    onUpdate({
      ...condition,
      payload: { ...condition.payload, [key]: value }
    });
  };

  const renderEditor = () => {
    switch (condition.type) {
      case "wallet_flow":
        return (
          <div className="space-y-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Select value={condition.payload.entity_type || "individual"} onValueChange={(v) => {
                onUpdate({
                  ...condition,
                  payload: { 
                    ...condition.payload, 
                    entity_type: v, 
                    label: v === 'group' ? 'smart_money' : undefined, 
                    address: v === 'individual' ? '' : undefined 
                  }
                });
              }}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Address</SelectItem>
                  <SelectItem value="group">Group</SelectItem>
                </SelectContent>
              </Select>
              <Select value={condition.payload.direction} onValueChange={(v) => updatePayload("direction", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Direction" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="inflow">Inflow</SelectItem>
                  <SelectItem value="outflow">Outflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                value={condition.payload.asset || ""} 
                placeholder="Asset (ETH)" 
                onChange={(e) => updatePayload("asset", e.target.value.toUpperCase())} 
                className="h-7 text-[10px]" 
              />
              <Input 
                type="number"
                value={condition.payload.value || ""} 
                placeholder="Min USD" 
                onChange={(e) => updatePayload("value", e.target.value)} 
                className="h-7 text-[10px]" 
              />
            </div>
            {condition.payload.entity_type === 'group' ? (
              <Select value={condition.payload.label || "smart_money"} onValueChange={(v) => updatePayload("label", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart_money">Smart Money Whales</SelectItem>
                  <SelectItem value="exchange_wallets">Exchange Wallets</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input 
                value={condition.payload.address || ""} 
                placeholder="Address (0x...)" 
                onChange={(e) => updatePayload("address", e.target.value)} 
                className="h-7 text-[10px]" 
              />
            )}
          </div>
        );
      case "exchange_flow":
        return (
          <div className="space-y-2 pt-2 border-t">
            <div className="grid grid-cols-2 gap-2">
              <Select value={condition.payload.exchange} onValueChange={(v) => updatePayload("exchange", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Exchange" /></SelectTrigger>
                <SelectContent>
                  {TIER_1_EXCHANGES.map(ex => <SelectItem key={ex} value={ex}>{ex.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={condition.payload.flow_type} onValueChange={(v) => updatePayload("flow_type", v)}>
                <SelectTrigger className="h-7 text-[10px]"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  <SelectItem value="net_flow">Net Flow</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input 
                value={condition.payload.asset || ""} 
                placeholder="Asset (BTC)" 
                onChange={(e) => updatePayload("asset", e.target.value.toUpperCase())} 
                className="h-7 text-[10px]" 
              />
              <Input 
                type="number"
                value={condition.payload.value || ""} 
                placeholder="Threshold" 
                onChange={(e) => updatePayload("value", e.target.value)} 
                className="h-7 text-[10px]" 
              />
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2 pt-1 border-t">
            <Input value={condition.label || ""} placeholder="Label" onChange={(e) => onUpdate({...condition, label: e.target.value})} className="h-7 text-xs" />
          </div>
        );
    }
  };

  return (
    <div className={cn("relative w-[280px] rounded-xl border-2 bg-card shadow-xl transition-all", selected ? "border-blue-500 ring-4 ring-blue-500/20" : "border-border/60")}>
      <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-4 !h-4" />
      <div className="flex items-center justify-between p-3 border-b bg-muted/30 rounded-t-xl">
        <div className="flex items-center gap-2">
          <Activity className={cn("w-4 h-4", 
            condition.type === "wallet_flow" ? "text-indigo-500" : 
            condition.type === "exchange_flow" ? "text-orange-500" : "text-blue-500"
          )} />
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
                <Line type="monotone" dataKey="value" stroke={
                  condition.type === "wallet_flow" ? "#6366f1" : 
                  condition.type === "exchange_flow" ? "#f97316" : "#3b82f6"
                } strokeWidth={2} dot={false} />
              </LineChart>
           </ResponsiveContainer>
        </div>
        {editing ? (
             <>
                {renderEditor()}
                <Button size="sm" variant="secondary" className="w-full h-6 text-xs mt-2" onClick={() => setEditing(false)}>Done</Button>
             </>
        ) : (
            <Button size="sm" variant="outline" className="w-full h-7 text-xs bg-background/50" onClick={() => setEditing(true)}>Edit Parameters</Button>
        )}
      </div>
    </div>
  );
};


export default ConditionNode