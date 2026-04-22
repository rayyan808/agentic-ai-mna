import { SaleRecordService } from "src/sale_record/sale_record.service";
import { EMA } from "./helpers/ema.helper";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { FinanceConfig } from "./finance.entity";
import { Repository } from "typeorm";
import { asset_info } from "src/assets/assets.constant";
import { AssetService } from "src/assets/assets.service";
import { CacheHelper } from "./helpers/cache.helper";

export class FinanceService {
  emaHelper: EMA;
  cacheHelper: CacheHelper;
  version: number;

  assetInfoCache: Map<string, Map<string, asset_info>>;

  constructor(
    @InjectRepository(FinanceConfig)
    private financeRepo: Repository<FinanceConfig>,
    private readonly saleRecordService: SaleRecordService,
    private readonly assetService: AssetService,
  ) {
    this.emaHelper = new EMA(parseInt(process.env.EMA_TIME_WINDOW));
    this.cacheHelper = new CacheHelper();
    this.version = parseInt(process.env.FINANCE_VERSION);
    this.assetInfoCache = new Map();
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async process() {
    try {
      const lastProcessedAt = await this.getLastProcessedAt();

      const records =
        await this.saleRecordService.getUnprocessedRecords(lastProcessedAt);
      if (records.length == 0) return;
      let latestTimestamp = lastProcessedAt;
      for (let { asset_name, currency, price, timestamp } of records) {
        //Check if we have at cache, otherwise pull from DB
        let asset_info = await this.cacheHelper.cacheHitOrPopulate(
          this.assetService,
          this.assetInfoCache,
          asset_name,
          currency,
        );
        const newEMA = this.emaHelper.calculateEMA(
          price,
          timestamp,
          asset_info.ema,
          asset_info.emaUpdatedAt,
        );
        console.log(`Got new EMA: ${newEMA} for ${asset_name}`);
        this.cacheHelper.setAssetInfo(
          this.assetInfoCache,
          asset_name,
          currency,
          {
            ema: newEMA,
            emaUpdatedAt: timestamp,
          },
        );
        if (timestamp > latestTimestamp) latestTimestamp = timestamp;
      }
      await this.cacheHelper.dumpCache(this.assetService, this.assetInfoCache);
      await this.setLastProcessedAt(latestTimestamp);
    } catch (e) {
      //TODO: Need a Dead letter Queue
      console.log(`[Finance] Error processing... \n ${e}`);
    }
  }

  async setLastProcessedAt(timestamp: number) {
    console.log(`[Finance] Setting last updated to: ${timestamp}`);
    await this.financeRepo.upsert(
      [{ version: this.version, latestTimestamp: timestamp }],
      ["version"],
    );
  }
  async getLastProcessedAt() {
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
        latestTimestamp: 0,
      });
      return 0;
    }
  }
}
