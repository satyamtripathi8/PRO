export type Position = {
  id: number;
  symbol: string;
  exchange: string;
  qty: number;
  avg: number;
  ltp: number;
  pnl: number;
  product: string;
  change?: number;
  percentage?: number;
  hasLiveData?: boolean;
};

export type Order = {
  id: number;
  date: string;
  time: string;
  symbol: string;
  type: "BUY" | "SELL";
  qty: number;
  avg: number;
};

export type OrderTab = "stocks" | "mutual";