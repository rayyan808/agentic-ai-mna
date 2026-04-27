export interface Sale {
  asset_name: string;
  currency: string;
  price: number;
  units: number;
  timestamp: number;
}

export enum TimePeriod {
  hour = "1 hour",
  six_hour = "6 hours",
  day = "1 day",
  week = "7 days",
  two_week = "2 weeks",
  month = "1 month",
}

export interface MovingAverage {
  bucket: string;
  avg_price: string;
}
