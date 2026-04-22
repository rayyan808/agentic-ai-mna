export interface asset {
  name: string;
  currency: string;
}
export interface Sale {
  asset_name: string;
  currency: string;
  price: number;
  units: number;
  timestamp: number;
}
