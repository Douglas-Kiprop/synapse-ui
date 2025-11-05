import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../components/ui/table";
import { GainersLosersResponse, MarketItem } from "../../types/market-data";
import { Button } from "../../components/ui/button";

const GainersLosersPage: React.FC = () => {
  const [gainersLosersData, setGainersLosersData] = useState<GainersLosersResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("24h");

  useEffect(() => {
    const fetchGainersLosers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_SYNAPSE_API_URL}/market/gainers-losers?limit=15&timeframe=${selectedTimeframe}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: GainersLosersResponse = await response.json();
        setGainersLosersData(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGainersLosers();
  }, [selectedTimeframe]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
  };

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Gainers & Losers</h2>
        <p>Loading gainers and losers data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Gainers & Losers</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Gainers & Losers</h2>
      </div>
      <div className="flex space-x-2 mb-4">
        <Button
          variant={selectedTimeframe === "1h" ? "default" : "outline"}
          onClick={() => handleTimeframeChange("1h")}
        >
          1h
        </Button>
        <Button
          variant={selectedTimeframe === "24h" ? "default" : "outline"}
          onClick={() => handleTimeframeChange("24h")}
        >
          24h
        </Button>
        <Button
          variant={selectedTimeframe === "7d" ? "default" : "outline"}
          onClick={() => handleTimeframeChange("7d")}
        >
          7d
        </Button>
        <Button
          variant={selectedTimeframe === "14d" ? "default" : "outline"}
          onClick={() => handleTimeframeChange("14d")}
        >
          14d
        </Button>
        <Button
          variant={selectedTimeframe === "30d" ? "default" : "outline"}
          onClick={() => handleTimeframeChange("30d")}
        >
          30d
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Gainers ({selectedTimeframe})</CardTitle>
          </CardHeader>
          <CardContent>
            {gainersLosersData?.gainers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Price Change</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gainersLosersData.gainers.map((item: MarketItem, index: number) => (
                    <TableRow key={item.symbol}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.symbol}</TableCell>
                      <TableCell>{item.current_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-green-500">{(item.percentage_change || item.percentage_change_24h)?.toFixed(2) || '0.00'}%</TableCell>
                      <TableCell>${item.volume?.toLocaleString() || '0'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No top gainers data available for this timeframe.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Losers ({selectedTimeframe})</CardTitle>
          </CardHeader>
          <CardContent>
            {gainersLosersData?.losers.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Price Change</TableHead>
                    <TableHead>Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gainersLosersData.losers.map((item: MarketItem, index: number) => (
                    <TableRow key={item.symbol}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.symbol}</TableCell>
                      <TableCell>{item.current_price?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell className="text-red-500">{(item.percentage_change || item.percentage_change_24h)?.toFixed(2) || '0.00'}%</TableCell>
                      <TableCell>${item.volume?.toLocaleString() || '0'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">No top losers data available for this timeframe.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GainersLosersPage;