import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChromiaService } from "src/chromia/chromia.service";
import { asset_info } from "./listener.constants";
import { normalizeCurrency } from "./listener.helpers";
import { todo } from "node:test";

@Injectable()
export class ListenerService {
  lastProcessedRow: string;
  page_size: number = 5000;
  constructor(private readonly chromiaService: ChromiaService) {}
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
    const cache: Map<string, asset_info> = new Map();
    //For each sale record
    for (let { asset_name, price, units, currency } of paginated_results.data) {
      this.appendToCache(
        cache,
        asset_name,
        normalizeCurrency(price, currency),
        Number(units),
      );
    }
  }
  async updateLastProcessedRow(newRow: string) {
    //Call DB and update
    !todo;
  }
  async getLastProcessedRow(): Promise<string> {
    //Call DB and return
    !todo;
  }
  async syncCache(cache: Map<string, asset_info>) {
    for (let [asset_name, asset_info] of cache.entries()) {
      //Call DB and update
    }
  }
  async appendToCache(
    cache: Map<string, asset_info>,
    asset_name: string,
    price: number,
    units: number,
  ) {
    if (cache.get(asset_name)) {
      cache[asset_name].summed_price += price;
      cache[asset_name].summed_units += units;
    } else {
      cache[asset_name] = { summed_price: price, summed_units: units };
    }
  }
  /**
   *
   *
   *
   */
}
