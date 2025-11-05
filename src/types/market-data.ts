export interface MarketItem {
  symbol: string;
  price_change_24h?: number;
  percentage_change_24h?: number;
  price_change?: number;
  percentage_change?: number;
  volume?: number;
}
  current_price: number;
  timestamp: string;
}

export interface GainersLosersResponse {
  gainers: MarketItem[];
  losers: MarketItem[];
}