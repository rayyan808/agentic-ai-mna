import { SaleRecordService } from "src/sale_record/sale_record.service";
import { InjectRepository } from "@nestjs/typeorm";
import { FinanceConfig } from "./finance.entity";
import { Repository } from "typeorm";
import { AssetService } from "src/assets/assets.service";
import { Candlestick, TradeWindow } from "src/sale_record/sale_record.dto";
import { AssetFinanceReport } from "./finance.dto";
import Decimal from "decimal.js";
import { calculateEMA, getAlpha } from "./helpers/ema.helper";

export class FinanceService {
  version: number;

  constructor(
    @InjectRepository(FinanceConfig)
    private financeRepo: Repository<FinanceConfig>,
    private readonly saleRecordService: SaleRecordService,
  ) {
    //  this.emaHelper = new EMA(parseInt(process.env.EMA_TIME_WINDOW));
    this.version = parseInt(process.env.FINANCE_VERSION);
  }
  async getFinanceReport(
    asset_name: string,
    token_name: string,
    tradeWindow: TradeWindow,
    fromDate: Date,
    toDate: Date,
  ): Promise<AssetFinanceReport> {
    try {
      console.log;
      const candles = await this.saleRecordService.getCandles(
        asset_name,
        token_name,
        fromDate,
        toDate,
        tradeWindow,
      );
      return this.produceFinanceReport(candles);
    } catch (e) {
      console.log(`Error producing the finance report \n ${e}`);
    }
  }

  private produceFinanceReport(candles: Candlestick[]): AssetFinanceReport {
    let EMA = new Decimal(0);
    const alpha = getAlpha(candles.length);
    let total_price_volume = new Decimal(0);
    let total_volume = new Decimal(0);
    let total_price = new Decimal(0);
    for (let candle of candles) {
      EMA = calculateEMA(EMA, candle.close, alpha);
      total_price_volume = total_price_volume.add(candle.sum_price_volume);
      total_volume = total_volume.add(candle.volume);
      total_price = total_price.add(candle.sum_price);
    }
    const result = {
      EMA,
      VWAP: total_price_volume.div(total_volume),
      average_price: total_price.div(total_volume),
    };
    console.log(
      `Produced financial report: ${JSON.stringify(result, null, 3)}`,
    );
    return result;
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
