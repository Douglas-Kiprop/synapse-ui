import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Clock, DollarSign } from "lucide-react";

interface StrategyBubbleProps {
  strategy: {
    name: string;
    type: string;
    allocation: string;
    timeframe: string;
    expectedReturn: string;
    riskLevel: "Low" | "Medium" | "High";
    description: string;
  };
  onApply: (strategy: any) => void;
}

export function StrategyBubble({ strategy, onApply }: StrategyBubbleProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "bg-crypto-green/20 text-crypto-green border-crypto-green/50";
      case "Medium": return "bg-crypto-orange/20 text-crypto-orange border-crypto-orange/50";
      case "High": return "bg-crypto-red/20 text-crypto-red border-crypto-red/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="bg-gradient-card border-border/50 shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            {strategy.name}
          </CardTitle>
          <Badge variant="outline" className={getRiskColor(strategy.riskLevel)}>
            {strategy.riskLevel} Risk
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          {strategy.description}
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3 h-3 text-crypto-blue" />
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <p className="text-xs font-medium text-foreground">{strategy.type}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-crypto-green" />
            <div>
              <p className="text-xs text-muted-foreground">Allocation</p>
              <p className="text-xs font-medium text-foreground">{strategy.allocation}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-crypto-purple" />
            <div>
              <p className="text-xs text-muted-foreground">Timeframe</p>
              <p className="text-xs font-medium text-foreground">{strategy.timeframe}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-3 h-3 text-crypto-orange" />
            <div>
              <p className="text-xs text-muted-foreground">Expected Return</p>
              <p className="text-xs font-medium text-foreground">{strategy.expectedReturn}</p>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={() => onApply(strategy)}
          className="w-full bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-glow"
          size="sm"
        >
          Apply Strategy
        </Button>
      </CardContent>
    </Card>
  );
}