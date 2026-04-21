import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChromiaService } from "src/chromia/chromia.service";
import { asset_info, AssetCache } from "./listener.constants";
import { normalizeCurrency } from "./listener.helpers";
import { InjectRepository } from "@nestjs/typeorm";
import { ListenerConfig } from "./entities/listener.entity";
import { Repository } from "typeorm";
import { AssetService } from "src/assets/assets.service";
import { asset } from "src/assets/assets.constant";

@Injectable()
export class ListenerService {
  version: number;
  lastProcessedRow: string;
  page_size: number = 5000;
  constructor(
    @InjectRepository(ListenerConfig)
    private listenerRepo: Repository<ListenerConfig>,
    private readonly assetService: AssetService,
    private readonly chromiaService: ChromiaService,
  ) {
    this.version = parseInt(process.env.LISTENER_VERSION) ?? 1;
  }
  /**.
   * TODO:
   * Keep track of the last processed rowid in the DB
   * On boot up, load this rowid and continue polling through the CRON
   *
   */
  async onModuleInit() {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async process() {
    //Query `storefront.get_sale_records` via Chromia Client
    const paginated_results = await this.chromiaService.get_sale_records(
      this.lastProcessedRow,
    );
    await this.updateLastProcessedRow(paginated_results.row_id);
    const cache: AssetCache = new Map();
    //For each sale record
    for (let { asset_name, price, units, currency } of paginated_results.data) {
      this.appendToCache(
        cache,
        { name: asset_name, currency },
        normalizeCurrency(price, currency),
        Number(units),
      );
    }
  }
  async updateLastProcessedRow(newRow: string) {
    const result = await this.listenerRepo.upsert(
      [
        {
          lastProcessedRow: newRow,
        },
      ],
      [],
    );
    console.log(`Updated Last processed row: ${result.raw}`);
  }
  async getLastProcessedRow(): Promise<string> {
    const exists = await this.listenerRepo.exists({
      where: {
        version: this.version,
      },
    });
    if (exists) {
      const config = await this.listenerRepo.findOneBy({
        version: this.version,
      });
      return config.lastProcessedRow;
    } else {
      console.log(`No Listener config detected, creating new..`);
      await this.listenerRepo.save({
        version: this.version,
        lastProcessedRow: "0",
      });
      return "0";
    }
  }
  async syncCache(allAssets: AssetCache) {
    console.log(`Syncing cache to DB..`);
    console.log(JSON.stringify(allAssets));
    for (let [asset_name, assetCaches] of allAssets.entries()) {
      for (let [currency, asset_info] of assetCaches.entries()) {
        await this.assetService.updateAsset(asset_name, currency, asset_info);
      }
    }
  }
  async appendToCache(
    cache: AssetCache,
    asset: asset,
    price: number,
    units: number,
  ) {
    const assetMap = cache.get(asset.name);
    if (!assetMap) {
      cache[asset.name][asset.currency] = { price, units };
      return;
    }
    if (cache.get(assetMap[asset.currency])) {
      assetMap[asset.currency].summed_price += price;
      assetMap[asset.currency].summed_units += units;
      return;
    } else {
      cache[asset.name][asset.currency] = { price, units };
      return;
    }
  }
}
