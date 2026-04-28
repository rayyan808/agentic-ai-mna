import Decimal from "decimal.js";

export interface Sale {
  asset_name: string;
  token_name: string;
  price: Decimal;
  units: number;
  timestamp: Date;
}

export interface Candlestick {
  bucket: Date;
  asset_name: string;
  token_name: string;
  open: Decimal;
  close: Decimal;
  low: Decimal;
  high: Decimal;
  volume: number;
  sum_price: Decimal;
  sum_price_volume: Decimal;
  trade_count: number;
  vwap: Decimal;
  avg_price: Decimal;
}
export enum TradeWindow {
  hourly = "hourly_trades",
  daily = "daily_trades",
  weekly = "weekly_trades",
  monthly = "monthly_trades",
}

export interface MovingAverage {
  bucket: string;
  avg_price: string;
}
