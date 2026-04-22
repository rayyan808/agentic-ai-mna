import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChromiaService } from "src/chromia/chromia.service";
import { InjectRepository } from "@nestjs/typeorm";
import { ListenerConfig } from "./entities/listener.entity";
import { Repository } from "typeorm";
import { AssetService } from "src/assets/assets.service";
import { SaleRecordService } from "src/sale_record/sale_record.service";

@Injectable()
export class ListenerService {
  version: number;
  page_size: number = 50;

  constructor(
    @InjectRepository(ListenerConfig)
    private listenerRepo: Repository<ListenerConfig>,
    private readonly assetService: AssetService,
    private readonly chromiaService: ChromiaService,
    private readonly saleRecordService: SaleRecordService,
  ) {
    this.version = parseInt(process.env.LISTENER_VERSION) ?? 1;
  }

  //@TODO: Convert this to atomic transactions, rollback on failure
  @Cron(CronExpression.EVERY_10_SECONDS)
  async process() {
    const lastProcessedRow = await this.getLastProcessedRow();
    try {
      const paginated_results = await this.chromiaService.get_sale_records(
        lastProcessedRow,
        this.page_size,
      );
      if (lastProcessedRow == paginated_results.row_id) return;
      //For each sale record
      for (let {
        asset_name,
        price,
        units,
        currency,
        timestamp,
      } of paginated_results.data) {
        await this.assetService.insertNewAsset(
          asset_name,
          currency,
          Number(price),
          timestamp,
        );
        await this.saleRecordService.insert({
          asset_name,
          price: Number(price),
          currency,
          units: Number(units),
          timestamp,
        });
      }

      await this.updateLastProcessedRow(paginated_results.row_id);
    } catch (e) {
      //Abort processing + log an error in the dead letter queue
      console.log(`[Listener] Error processing... \n ${e}`);
    }
  }
  async updateLastProcessedRow(newRow: number) {
    await this.listenerRepo.upsert(
      {
        version: this.version,
        lastProcessedRow: newRow,
      },
      ["version"],
    );
    console.log(`[Listener] Updated Last processed row to ${newRow}`);
  }
  async getLastProcessedRow(): Promise<number> {
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
      console.log(`[Listener] No Listener config detected, creating new..`);
      await this.listenerRepo.save({
        version: this.version,
        lastProcessedRow: 0,
      });
      console.log(`[Listener] Created new entry with value: 0`);
      return 0;
    }
  }
}
