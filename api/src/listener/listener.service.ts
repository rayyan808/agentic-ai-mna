import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChromiaService } from "src/chromia/chromia.service";
import { AssetCache } from "./listener.constants";
import { InjectRepository } from "@nestjs/typeorm";
import { ListenerConfig } from "./entities/listener.entity";
import { Repository } from "typeorm";
import { AssetService } from "src/assets/assets.service";
import { asset } from "src/assets/assets.constant";
import { SaleRecordService } from "./sale_record/sale_record.service";

@Injectable()
export class ListenerService {
  version: number;
  page_size: number = 5;

  cache: AssetCache = new Map();
  constructor(
    @InjectRepository(ListenerConfig)
    private listenerRepo: Repository<ListenerConfig>,
    private readonly assetService: AssetService,
    private readonly chromiaService: ChromiaService,
    private readonly saleRecordService: SaleRecordService,
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

  //@TODO: Use a Message Queue here for cleaner architecture
  //@TODO: Convert this to atomic transactions, rollback on failure
  @Cron(CronExpression.EVERY_10_SECONDS)
  async process() {
    console.log(`Processing CRON Sweep...`);
    const lastProcessedRow = await this.getLastProcessedRow();
    try {
      const paginated_results = await this.chromiaService.get_sale_records(
        lastProcessedRow,
        this.page_size,
      );
      if (lastProcessedRow == paginated_results.row_id) {
        console.log(`No new records to process.`);
        return;
      }
      //For each sale record
      for (let {
        asset_name,
        price,
        units,
        currency,
        timestamp,
      } of paginated_results.data) {
        // const normalizedPrice = normalizeCurrency(price, currency);
        const convertedUnits = Number(units);
        this.appendToCache(
          { name: asset_name, currency },
          Number(price),
          convertedUnits,
        );
        await this.saleRecordService.insert({
          asset_name,
          price: Number(price),
          currency,
          units: convertedUnits,
          timestamp,
        });
      }
      console.log(`Built cache \n ${JSON.stringify(this.cache, null, 3)}`);
      await this.syncCache();
      await this.updateLastProcessedRow(paginated_results.row_id);

      this.cache = new Map();
    } catch (e) {
      //Abort processing + log an error in the dead letter queue
      console.log("Error processing...");
      console.log(e);
      //
    }
  }
  async updateLastProcessedRow(newRow: number) {
    console.log(`Updating last processed row..`);
    const result = await this.listenerRepo.upsert(
      {
        version: this.version,
        lastProcessedRow: newRow,
      },
      ["version"],
    );
    console.log(`Updated Last processed row to ${newRow}`);
  }
  async getLastProcessedRow(): Promise<number> {
    console.log(`Getting last processed row...`);
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
        lastProcessedRow: 0,
      });
      console.log(`Created new entry with value: 0`);
      return 0;
    }
  }
  async syncCache() {
    console.log(`Syncing cache with ${this.cache.size} entries to DB..`);

    for (let [asset_name, asset_map] of this.cache.entries()) {
      console.log(`Iterating map for: ${asset_name}`);
      for (let [currency, asset_info] of asset_map.entries()) {
        console.log(
          `Found currency ${currency} for ${asset_name}, storing to DB..`,
        );
        await this.assetService.updateAsset(asset_name, currency, asset_info);
      }
    }
  }
  async appendToCache(asset: asset, price: number, units: number) {
    console.log(`Appending ${asset.name} ${asset.currency} to local cache`);

    let assetMap = this.cache.get(asset.name);
    if (!assetMap) {
      assetMap = new Map();
      this.cache.set(asset.name, assetMap);
    }

    const existing = assetMap.get(asset.currency);
    if (existing) {
      existing.summed_price += price;
      existing.summed_units += units;
    } else {
      assetMap.set(asset.currency, {
        summed_price: price,
        summed_units: units,
      });
    }
  }
}
