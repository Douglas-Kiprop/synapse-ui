import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component

const MarketDataPage: React.FC = () => {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Market Data</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Overview Cards - similar to AnalyticsPage */}
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Market Cap</CardTitle>
            {/* Icon placeholder */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2.1T</div>
            <p className="text-xs text-muted-foreground">+3.2% (24h)</p>
          </CardContent>
        </Card>
        <Card className="col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume</CardTitle>
            {/* Icon placeholder */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$89.5B</div>
            <p className="text-xs text-muted-foreground">-1.8% (24h)</p>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dominance</CardTitle>
            {/* Icon placeholder */}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52.3%</div>
            <p className="text-xs text-muted-foreground">BTC</p>
          </CardContent>
        </Card>

        {/* Gainers & Losers Widget */}
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Gainers & Losers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              See the top performing and worst performing assets in the last 24 hours.
            </p>
            <Link to="/market-data/gainers-losers">
              <Button>View Detailed Gainers & Losers</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Placeholder for other market data sections */}
        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Advanced Market Data coming soon...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Comprehensive market data tools like Open Interest, Funding Rates, and Liquidation data will be available here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketDataPage;