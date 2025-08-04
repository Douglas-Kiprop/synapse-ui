import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Target,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  trend: "up" | "down";
}

function MetricCard({ title, value, change, icon, trend }: MetricCardProps) {
  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-glow transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <div className="flex items-center gap-1">
              {trend === "up" ? (
                <ArrowUpRight className="w-4 h-4 text-crypto-green" />
              ) : (
                <ArrowDownRight className="w-4 h-4 text-crypto-red" />
              )}
              <span className={cn(
                "text-sm font-medium",
                trend === "up" ? "text-crypto-green" : "text-crypto-red"
              )}>
                {Math.abs(change)}%
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const portfolioData = [
    { name: "BTC", value: 45, amount: "$45,230", change: 12.5 },
    { name: "ETH", value: 30, amount: "$30,120", change: 8.3 },
    { name: "SOL", value: 15, amount: "$15,080", change: -2.1 },
    { name: "Others", value: 10, amount: "$10,570", change: 5.7 },
  ];

  const signals = [
    { type: "BUY", asset: "AVAX", confidence: 85, timeframe: "1h" },
    { type: "SELL", asset: "MATIC", confidence: 72, timeframe: "4h" },
    { type: "HOLD", asset: "DOT", confidence: 68, timeframe: "1d" },
    { type: "BUY", asset: "LINK", confidence: 91, timeframe: "1d" },
  ];

  return (
    <div className="space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">Your crypto analytics overview</p>
        </div>
        <Badge variant="outline" className="border-crypto-green text-crypto-green">
          <Activity className="w-3 h-3 mr-1" />
          All Systems Online
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Portfolio Value"
          value="$101K"
          change={12.5}
          trend="up"
          icon={<DollarSign className="w-6 h-6 text-primary" />}
        />
        <MetricCard
          title="24h P&L"
          value="+$2,340"
          change={8.3}
          trend="up"
          icon={<TrendingUp className="w-6 h-6 text-crypto-green" />}
        />
        <MetricCard
          title="Active Strategies"
          value="7"
          change={-5.2}
          trend="down"
          icon={<Target className="w-6 h-6 text-crypto-blue" />}
        />
        <MetricCard
          title="Success Rate"
          value="78%"
          change={15.7}
          trend="up"
          icon={<BarChart3 className="w-6 h-6 text-crypto-purple" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Breakdown */}
        <Card className="lg:col-span-2 bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Portfolio Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {portfolioData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-gradient-primary" />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{item.amount}</p>
                      <p className={cn(
                        "text-sm",
                        item.change > 0 ? "text-crypto-green" : "text-crypto-red"
                      )}>
                        {item.change > 0 ? "+" : ""}{item.change}%
                      </p>
                    </div>
                  </div>
                  <Progress value={item.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trading Signals */}
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Live Signals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signals.map((signal, index) => (
                <div key={index} className="p-3 rounded-lg bg-background/30 border border-border/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={signal.type === "BUY" ? "default" : signal.type === "SELL" ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {signal.type}
                      </Badge>
                      <span className="font-semibold text-sm">{signal.asset}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{signal.timeframe}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Confidence</span>
                    <span className="text-sm font-medium">{signal.confidence}%</span>
                  </div>
                  <Progress value={signal.confidence} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fear & Greed Index</span>
                <span className="font-semibold text-crypto-orange">42 (Fear)</span>
              </div>
              <Progress value={42} className="h-2" />
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-3 rounded-lg bg-background/30">
                  <p className="text-2xl font-bold text-crypto-green">68%</p>
                  <p className="text-xs text-muted-foreground">Bulls</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-background/30">
                  <p className="text-2xl font-bold text-crypto-red">32%</p>
                  <p className="text-xs text-muted-foreground">Bears</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-crypto-orange/30 bg-crypto-orange/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-crypto-orange" />
                  <span className="text-sm font-medium">High Volatility</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  BTC showing increased volatility in the last 4 hours
                </p>
              </div>
              
              <div className="p-3 rounded-lg border border-crypto-blue/30 bg-crypto-blue/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-crypto-blue" />
                  <span className="text-sm font-medium">Strategy Performance</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  "DeFi Momentum" strategy outperforming by 15%
                </p>
              </div>

              <div className="p-3 rounded-lg border border-crypto-green/30 bg-crypto-green/10">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-crypto-green" />
                  <span className="text-sm font-medium">Opportunity</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Strong accumulation signals detected in AVAX
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}