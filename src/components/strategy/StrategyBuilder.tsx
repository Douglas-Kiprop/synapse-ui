import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Brain, 
  Plus, 
  Trash2, 
  TrendingUp, 
  Target, 
  DollarSign,
  AlertTriangle,
  Settings,
  Save,
  Share
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Strategy {
  id: string;
  name: string;
  description: string;
  riskLevel: number;
  targetReturn: number;
  conditions: Condition[];
  assets: string[];
  timeframe: string;
}

interface Condition {
  id: string;
  type: 'technical' | 'fundamental' | 'sentiment';
  indicator: string;
  operator: 'greater' | 'less' | 'equal' | 'cross_above' | 'cross_below';
  value: number;
  weight: number;
}

interface StrategyBuilderProps {
  onStrategyChange?: (strategy: Strategy) => void;
  initialStrategy?: Strategy;
}

export function StrategyBuilder({ onStrategyChange, initialStrategy }: StrategyBuilderProps) {
  const [strategy, setStrategy] = useState<Strategy>(initialStrategy || {
    id: Date.now().toString(),
    name: "New Strategy",
    description: "",
    riskLevel: 5,
    targetReturn: 10,
    conditions: [],
    assets: [],
    timeframe: "1d"
  });
  
  const { toast } = useToast();

  const indicators = [
    "RSI", "MACD", "Moving Average", "Bollinger Bands", "Volume", 
    "Price Change", "Market Cap", "Social Sentiment", "News Sentiment"
  ];

  const assets = [
    "BTC", "ETH", "SOL", "AVAX", "MATIC", "ADA", "DOT", "LINK", "UNI", "AAVE"
  ];

  const addCondition = () => {
    const newCondition: Condition = {
      id: Date.now().toString(),
      type: 'technical',
      indicator: 'RSI',
      operator: 'greater',
      value: 70,
      weight: 1
    };
    
    const updatedStrategy = {
      ...strategy,
      conditions: [...strategy.conditions, newCondition]
    };
    
    setStrategy(updatedStrategy);
    onStrategyChange?.(updatedStrategy);
  };

  const removeCondition = (conditionId: string) => {
    const updatedStrategy = {
      ...strategy,
      conditions: strategy.conditions.filter(c => c.id !== conditionId)
    };
    
    setStrategy(updatedStrategy);
    onStrategyChange?.(updatedStrategy);
  };

  const updateCondition = (conditionId: string, updates: Partial<Condition>) => {
    const updatedStrategy = {
      ...strategy,
      conditions: strategy.conditions.map(c => 
        c.id === conditionId ? { ...c, ...updates } : c
      )
    };
    
    setStrategy(updatedStrategy);
    onStrategyChange?.(updatedStrategy);
  };

  const addAsset = (asset: string) => {
    if (!strategy.assets.includes(asset)) {
      const updatedStrategy = {
        ...strategy,
        assets: [...strategy.assets, asset]
      };
      
      setStrategy(updatedStrategy);
      onStrategyChange?.(updatedStrategy);
    }
  };

  const removeAsset = (asset: string) => {
    const updatedStrategy = {
      ...strategy,
      assets: strategy.assets.filter(a => a !== asset)
    };
    
    setStrategy(updatedStrategy);
    onStrategyChange?.(updatedStrategy);
  };

  const saveStrategy = () => {
    toast({
      title: "Strategy Saved",
      description: `"${strategy.name}" has been saved successfully.`,
    });
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return "text-crypto-green";
    if (risk <= 7) return "text-crypto-orange";
    return "text-crypto-red";
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return "Conservative";
    if (risk <= 7) return "Moderate";
    return "Aggressive";
  };

  return (
    <div className="space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Strategy Builder</h1>
            <p className="text-muted-foreground">Create and refine your investment strategies</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={saveStrategy} size="sm" className="bg-gradient-primary">
            <Save className="w-4 h-4 mr-2" />
            Save Strategy
          </Button>
        </div>
      </div>

      {/* Strategy Overview */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Strategy Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strategy Name</Label>
              <Input
                value={strategy.name}
                onChange={(e) => {
                  const updatedStrategy = { ...strategy, name: e.target.value };
                  setStrategy(updatedStrategy);
                  onStrategyChange?.(updatedStrategy);
                }}
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select
                value={strategy.timeframe}
                onValueChange={(value) => {
                  const updatedStrategy = { ...strategy, timeframe: value };
                  setStrategy(updatedStrategy);
                  onStrategyChange?.(updatedStrategy);
                }}
              >
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="1h">1 Hour</SelectItem>
                  <SelectItem value="1d">1 Day</SelectItem>
                  <SelectItem value="1w">1 Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={strategy.description}
              onChange={(e) => {
                const updatedStrategy = { ...strategy, description: e.target.value };
                setStrategy(updatedStrategy);
                onStrategyChange?.(updatedStrategy);
              }}
              placeholder="Describe your strategy..."
              className="bg-background/50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Level: {strategy.riskLevel}/10
                <span className={cn("font-semibold", getRiskColor(strategy.riskLevel))}>
                  ({getRiskLabel(strategy.riskLevel)})
                </span>
              </Label>
              <Slider
                value={[strategy.riskLevel]}
                onValueChange={(value) => {
                  const updatedStrategy = { ...strategy, riskLevel: value[0] };
                  setStrategy(updatedStrategy);
                  onStrategyChange?.(updatedStrategy);
                }}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Target Return: {strategy.targetReturn}%
              </Label>
              <Slider
                value={[strategy.targetReturn]}
                onValueChange={(value) => {
                  const updatedStrategy = { ...strategy, targetReturn: value[0] };
                  setStrategy(updatedStrategy);
                  onStrategyChange?.(updatedStrategy);
                }}
                max={100}
                min={1}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Selection */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Asset Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={addAsset}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Add asset to strategy" />
              </SelectTrigger>
              <SelectContent>
                {assets.map(asset => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex flex-wrap gap-2">
              {strategy.assets.map(asset => (
                <Badge
                  key={asset}
                  variant="secondary"
                  className="flex items-center gap-1 px-3 py-1"
                >
                  {asset}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => removeAsset(asset)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conditions */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Strategy Conditions
            </CardTitle>
            <Button onClick={addCondition} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add Condition
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {strategy.conditions.map((condition) => (
              <Card key={condition.id} className="p-4 bg-background/30">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={condition.type}
                      onValueChange={(value: any) => updateCondition(condition.id, { type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="fundamental">Fundamental</SelectItem>
                        <SelectItem value="sentiment">Sentiment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Indicator</Label>
                    <Select
                      value={condition.indicator}
                      onValueChange={(value) => updateCondition(condition.id, { indicator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {indicators.map(indicator => (
                          <SelectItem key={indicator} value={indicator}>
                            {indicator}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Operator</Label>
                    <Select
                      value={condition.operator}
                      onValueChange={(value: any) => updateCondition(condition.id, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greater">Greater than</SelectItem>
                        <SelectItem value="less">Less than</SelectItem>
                        <SelectItem value="equal">Equal to</SelectItem>
                        <SelectItem value="cross_above">Cross above</SelectItem>
                        <SelectItem value="cross_below">Cross below</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: parseFloat(e.target.value) })}
                    />
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeCondition(condition.id)}
                    className="hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {strategy.conditions.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No conditions added yet. Click "Add Condition" to start building your strategy.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}