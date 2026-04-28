import Decimal from "decimal.js";

export interface AssetFinanceReport {
  // relative_strength_index: Decimal; //@TODO
  EMA: Decimal;
  VWAP: Decimal;
  average_price: Decimal;
}
