export type asset_info = { summed_price: number; summed_units: number };

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
