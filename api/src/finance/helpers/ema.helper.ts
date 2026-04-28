import Decimal from "decimal.js";
import { Candlestick, TradeWindow } from "src/sale_record/sale_record.dto";

export class EMA {
  halfLife: number;

  constructor(timeInMS: number) {
    this.halfLife = timeInMS;
  }

  getAlpha(timeElapsedInMS: number) {
    return 1 - Math.exp(-timeElapsedInMS / this.halfLife);
  }

  //EMA = (recent_sold_at_price × α) + (EMA × (1 − α))
  calculateEMA(
    price: number,
    purchasedAt: number,
    ema: number | null,
    emaUpatedAt: number | null,
  ) {
    if (ema !== null && emaUpatedAt !== null) {
      const elapsed = Math.max(purchasedAt - emaUpatedAt, 1);
      const alpha = this.getAlpha(elapsed);
      const newEMA = price * alpha + ema * (1 - alpha);
      return newEMA;
    } else {
      //No historical data for this asset yet, current price is the EMA
      console.log(`No historical data for this asset, returning price`);
      return price;
    }
  }
  calculateEMAForCandle(prevEMA: Decimal, candle: Candlestick, alpha: number) {
    const closing_price = candle.close;
    if (prevEMA.equals(0)) return closing_price;

    return closing_price.mul(alpha).add(prevEMA.mul(1 - alpha));
  }

  private getTimeIntervalInMS(tradeWindow: TradeWindow): number {
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
  }
}

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
