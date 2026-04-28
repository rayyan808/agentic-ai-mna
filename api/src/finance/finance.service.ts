import { SaleRecordService } from "src/sale_record/sale_record.service";
import { EMA } from "./helpers/ema.helper";
import { InjectRepository } from "@nestjs/typeorm";
import { FinanceConfig } from "./finance.entity";
import { Repository } from "typeorm";
import { AssetService } from "src/assets/assets.service";
import { Candlestick, TradeWindow } from "src/sale_record/sale_record.dto";
import { AssetFinanceReport } from "./finance.dto";
import Decimal from "decimal.js";

export class FinanceService {
  emaHelper: EMA;
  version: number;

  constructor(
    @InjectRepository(FinanceConfig)
    private financeRepo: Repository<FinanceConfig>,
    private readonly saleRecordService: SaleRecordService,
    private readonly assetService: AssetService,
  ) {
    this.emaHelper = new EMA(parseInt(process.env.EMA_TIME_WINDOW));
    this.version = parseInt(process.env.FINANCE_VERSION);
  }
  async getFinanceReport(
    asset_name: string,
    token_name: string,
    tradeWindow: TradeWindow,
    fromDate: Date,
    toDate: Date,
  ) {
    const candles = await this.saleRecordService.getCandles(
      asset_name,
      token_name,
      fromDate,
      toDate,
      tradeWindow,
    );
    console.log(`Got candles: \n ${JSON.stringify(candles, null, 3)}`);
    this.produceFinanceReport(candles, tradeWindow);
  }

  private produceFinanceReport(
    candles: Candlestick[],
    tradeWindow: TradeWindow,
  ): AssetFinanceReport {
    let EMA = new Decimal(0);
    let alpha = this.emaHelper.getAlpha(tradeWindow);
    for (let candle of candles) {
      EMA = this.emaHelper.calculateEMAForCandle(EMA, candle, alpha);
    }
  }
  private async setLastProcessedAt(timestamp: Date) {
    await this.financeRepo.upsert(
      [{ version: this.version, latestTimestamp: timestamp }],
      ["version"],
    );
  }
  private async getLastProcessedAt() {
    const config = await this.financeRepo.find({
      where: {
        version: this.version,
      },
    });
    if (config.length > 0) {
      return config[0].latestTimestamp;
    } else {
      console.log(`Finance config doesn't exist, creating...`);
      await this.financeRepo.insert({
        version: this.version,
        latestTimestamp: new Date(0),
      });
      return new Date(0);
    }
  }
}
