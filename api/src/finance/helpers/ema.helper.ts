import Decimal from "decimal.js";
import { TradeWindow } from "src/sale_record/sale_record.dto";

const getAlpha = (period: number) => {
  return 2 / (period + 1);
};

//EMA = (recent_sold_at_price × alpha) + (EMA × (1 − alpha))
const calculateEMA = (
  prevEMA: Decimal,
  price: Decimal,
  alpha: number,
): Decimal => {
  if (prevEMA.equals(0)) return price;
  return price.mul(alpha).add(prevEMA.mul(1 - alpha));
};

const getTimeIntervalInMS = (tradeWindow: TradeWindow): number => {
  switch (tradeWindow) {
    case TradeWindow.hourly:
      return 3.6e6;
    case TradeWindow.daily:
      return 8.64e7;
    case TradeWindow.weekly:
      return 6.048e8;
    case TradeWindow.monthly:
      return 2.419e9;
  }
};
export { getAlpha, calculateEMA };
/**
 * WINDOW_SIZE = 20
 * Keep track of last WINDOW_SIZE trades and their timestamps
 *
 * For each incoming sale_record
 * Get recent_trades for asset, store in Cache
 * update asset_info.median into cache
 * At the end, dump cache and update asset_info.median
 *
 * Incoming sale record => {
 *  Insert into recent_trades
 *  Calculate new median
 *  Push median for asset to cache
 *  Get median of recent_trades @* { asset_name, currency }
 * }
 */
