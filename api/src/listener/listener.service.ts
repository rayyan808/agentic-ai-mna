import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChromiaService } from "src/chromia/chromia.service";

@Injectable()
export class ListenerService {
  lastProcessedRow: number;
  constructor(private readonly chromiaService: ChromiaService) {}
  /**.
   * TODO:
   * Keep track of the last processed rowid in the DB
   * On boot up, load this rowid and continue polling through the CRON
   *
   */
  async onModuleInit() {}
  @Cron(CronExpression.EVERY_10_SECONDS)
  process() {
    //Query `storefront.get_sale_records` via Chromia Client
    //For each sale record
    //SELECT * FROM "asset_prices" WHERE "name" = sale_record.asset_name
    //edge case: if null just add new entry INSERT INTO "asset_prices" (asset_name, , total_sales = 1)
    //common case: (pre-existing asset)
    //UPDATE "asset_prices" WHERE "asset_name" = sale_record.asset_name SET ("twap", "total_sales") (
    // total_sales += 1
    // twap = (twap + sale_record.price_per_unit) / total_sales;
    //);
  }
}
