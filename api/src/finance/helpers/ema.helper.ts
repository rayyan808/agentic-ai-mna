export class EMA {
  halfLife: number;
  alpha: number = 3_600_000; //1 hour in UNIX epoch miliseconds

  constructor(timeInMS: number) {
    this.alpha = timeInMS;
  }
  private getAlpha(timeElapsedInMS: number) {
    return 2 / (timeElapsedInMS + 1);
  }

  //EMA = (recent_sold_at_price × α) + (EMA × (1 − α))
  //α = 2 / (N + 1)
  calculateEMA(
    price: number,
    purchasedAt: number,
    ema: number | null,
    emaUpatedAt: number | null,
  ) {
    if (ema && emaUpatedAt) {
      const elapsed = purchasedAt - emaUpatedAt;
      if (elapsed <= 0) return ema;
      const alpha = this.getAlpha(elapsed);
      const newEMA = price * alpha + ema * (1 - alpha);
      return newEMA;
    } else {
      //No historical data for this asset yet, current price is the EMA
      return price;
    }
  }
}
