import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseCondition, ConditionType, LogicNodeGroup, UUID } from "@/types/builder";
import { ensureGroupHasId } from "@/lib/builderutils";

export const ConditionEditor = ({
  condition,
  onChange,
  onRemove,
  availableAssets = [],
}: {
  condition: BaseCondition;
  onChange: (c: BaseCondition) => void;
  onRemove: (id: UUID) => void;
  availableAssets?: string[];
}) => {
  const indicators = ["rsi", "macd", "ema", "sma", "bollinger"];
  
  return (
    <div className="p-4 border rounded-xl bg-card hover:border-primary/30 transition-colors shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-2 items-center">
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{condition.type.replace(/_/g, ' ').toUpperCase()}</Badge>
          <Select
            value={condition.type}
            onValueChange={(v: any) => {
              const type = v as ConditionType;
              let newPayload: Record<string, any> = {};
              // Payload logic preserved exactly
              if (type === "technical_indicator") {
                newPayload = { indicator: "rsi", operator: "lt", value: 30, timeframe: "1h", asset: availableAssets[0] ?? "" };
              } else if (type === "price_alert") {
                newPayload = { asset: availableAssets[0] ?? "", direction: "above", target_price: 0 };
              } else if (type === "volume_alert") {
                newPayload = { asset: availableAssets[0] ?? "", timeframe: "1h", operator: "gt", threshold: 0 };
              } else {
                newPayload = {};
              }
              onChange({ ...condition, type, payload: newPayload });
            }}
          >
            <SelectTrigger className="h-7 w-[160px] text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="technical_indicator">Technical Indicator</SelectItem>
              <SelectItem value="price_alert">Price Alert</SelectItem>
              <SelectItem value="volume_alert">Volume Alert</SelectItem>
              <SelectItem value="wallet_flow">Wallet Flow</SelectItem>
              <SelectItem value="exchange_flow">Exchange Flow</SelectItem>
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
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Asset</Label>
              {availableAssets && availableAssets.length > 0 ? (
                <Select
                  value={condition.payload.asset ?? availableAssets[0]}
                  onValueChange={(v: any) =>
                    onChange({ ...condition, payload: { ...condition.payload, asset: v } })
                  }
                >
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableAssets.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={condition.payload.asset ?? ""}
                  onChange={(e) =>
                    onChange({ ...condition, payload: { ...condition.payload, asset: e.target.value } })
                  }
                  className="h-9"
                  placeholder="e.g., BTC"
                />
              )}
            </div>
          </div>
        )}

        {condition.type === "price_alert" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Asset</Label>
              <Input
                value={condition.payload.asset ?? ""}
                onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, asset: e.target.value } })}
                className="h-9"
                placeholder="e.g., BTC"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Direction</Label>
              <Select
                value={condition.payload.direction ?? "above"}
                onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, direction: v } })}
              >
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="above">Above</SelectItem>
                  <SelectItem value="below">Below</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Target Price</Label>
              <Input
                type="number"
                value={condition.payload.target_price ?? ""}
                onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, target_price: parseFloat(e.target.value) || 0 } })}
                className="h-9"
                placeholder="e.g., 50000"
              />
            </div>
          </div>
        )}

        {condition.type === "wallet_flow" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Entity Type</Label>
              <Select value={condition.payload.entity_type ?? "individual"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, entity_type: v, label: v === 'group' ? 'smart_money' : undefined, address: v === 'individual' ? '' : undefined } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Specific Address</SelectItem>
                  <SelectItem value="group">Labeled Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Direction</Label>
              <Select value={condition.payload.direction ?? "inflow"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, direction: v } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="inflow">Inflow</SelectItem><SelectItem value="outflow">Outflow</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Asset</Label>
              <Input value={condition.payload.asset ?? ""} onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, asset: e.target.value.toUpperCase() } })} className="h-9" placeholder="e.g. ETH" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">{condition.payload.entity_type === 'group' ? 'Label Name' : 'Wallet Address'}</Label>
              {condition.payload.entity_type === 'group' ? (
                <Select value={condition.payload.label ?? "smart_money"} onValueChange={(v) => onChange({ ...condition, payload: { ...condition.payload, label: v } })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smart_money">Smart Money Whales</SelectItem>
                    <SelectItem value="exchange_wallets">Exchange Wallets</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Input 
                  value={condition.payload.address ?? ""} 
                  onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, address: e.target.value } })}
                  className="h-9" 
                  placeholder="0x..." 
                />
              )}
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground mb-1 block">Min Value (USD)</Label>
              <Input type="number" value={condition.payload.value ?? ""} onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, value: parseFloat(e.target.value) || 0 } })} className="h-9" />
            </div>
          </div>
        )}

        {condition.type === "exchange_flow" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Exchange</Label>
              <Select value={condition.payload.exchange ?? "binance"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, exchange: v } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{["binance", "coinbase", "okx", "kraken", "bybit"].map(ex => <SelectItem key={ex} value={ex}>{ex.toUpperCase()}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Flow Type</Label>
              <Select value={condition.payload.flow_type ?? "net_flow"} onValueChange={(v: any) => onChange({ ...condition, payload: { ...condition.payload, flow_type: v } })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="deposit">Deposit</SelectItem><SelectItem value="withdrawal">Withdrawal</SelectItem><SelectItem value="net_flow">Net Flow</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Asset</Label>
              <Input value={condition.payload.asset ?? ""} onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, asset: e.target.value.toUpperCase() } })} className="h-9" placeholder="e.g. BTC" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Threshold</Label>
              <Input type="number" value={condition.payload.value ?? ""} onChange={(e) => onChange({ ...condition, payload: { ...condition.payload, value: parseFloat(e.target.value) || 0 } })} className="h-9" />
            </div>
          </div>
        )}

        {condition.type !== "technical_indicator" && condition.type !== "price_alert" && condition.type !== "volume_alert" && (
             <div className="p-3 bg-muted/20 rounded-md text-sm text-muted-foreground border border-dashed text-center">
                 Configure {condition.type.replace(/_/g, ' ')} parameters here.
             </div>
        )}
      </div>
    </div>
  );
};

export const SimpleLogicTree = ({ node, conditions, depth = 0, onUpdateGroup, onRemoveGroup, onAddCondition, onAddGroup, onUpdateCondition, onRemoveCondition, availableAssets }: any) => {
    if ("ref" in node) {
        const cond = conditions.find((c: any) => c.id === node.ref);
        if (!cond) return <div className="p-2 text-red-500 text-xs border rounded bg-red-50">Missing Condition</div>;
        return <div className="ml-6"><ConditionEditor condition={cond} onChange={onUpdateCondition} onRemove={onRemoveCondition} availableAssets={availableAssets} /></div>;
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


export default SimpleLogicTree