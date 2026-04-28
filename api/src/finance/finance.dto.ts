import Decimal from "decimal.js";

export interface AssetFinanceReport {
  relative_strength_index: Decimal;
  exponential_moving_average: Decimal;
  volume_weighted_average_price: Decimal;
  average_price: Decimal;
}
