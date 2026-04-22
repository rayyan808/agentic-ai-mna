import { EMA } from "./helpers/ema.helper";

export class FinanceService {
  emaHelper: EMA;
  constructor() {
    this.emaHelper = new EMA(parseInt(process.env.EMA_TIME_WINDOW));
  }
}
