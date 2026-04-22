export class EMA {
  halfLife: number;

  constructor(timeInMS: number) {
    this.halfLife = timeInMS;
  }

  private getAlpha(timeElapsedInMS: number) {
    return 1 - Math.exp(-timeElapsedInMS / this.halfLife);
  }

  //EMA = (recent_sold_at_price × α) + (EMA × (1 − α))
  calculateEMA(
    price: number,
    purchasedAt: number,
    ema: number | null,
    emaUpatedAt: number | null,
  ) {
    if (ema && emaUpatedAt) {
      const elapsed = purchasedAt - emaUpatedAt;
      if (elapsed <= 0) {
        console.log(`elapsed <=0, returning same ema`);
        return ema;
      }
      const alpha = this.getAlpha(elapsed);
      const newEMA = price * alpha + ema * (1 - alpha);
      return newEMA;
    } else {
      //No historical data for this asset yet, current price is the EMA
      console.log(`No historical data for this asset, returning price`);
      return price;
    }
  }
}
