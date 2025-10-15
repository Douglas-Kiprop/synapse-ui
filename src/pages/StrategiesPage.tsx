import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Activity, TrendingUp } from "lucide-react";

const StrategiesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Strategies
        </h1>
        <p className="text-muted-foreground">Curated and custom crypto strategies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Suggested Allocation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">$25,000</p>
            <p className="text-sm text-muted-foreground">Example allocation</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Risk Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">Medium</p>
            <p className="text-sm text-muted-foreground">Balanced approach</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Expected Return
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-foreground">15–25% APY</p>
            <p className="text-sm text-muted-foreground">Illustrative range</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle>Advanced Strategies coming soon...</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Explore curated, backtested strategies and build your own with smart templates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StrategiesPage;