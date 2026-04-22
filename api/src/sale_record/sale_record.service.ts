import { MoreThan, Repository } from "typeorm";
import { Sale } from "./sale_record.dto";
import { SaleRecord } from "src/sale_record/sale.entity";
import { InjectRepository } from "@nestjs/typeorm";

export class SaleRecordService {
  constructor(
    @InjectRepository(SaleRecord) private saleRepo: Repository<SaleRecord>,
  ) {}
  async insert(data: Sale) {
    console.log(`Creating Sale Record for ${JSON.stringify(data)}..`);
    await this.saleRepo.insert({
      ...data,
    });
    return;
  }

  async getUnprocessedRecords(
    processedTillTimestamp: number,
  ): Promise<SaleRecord[]> {
    const res = await this.saleRepo.find({
      where: {
        timestamp: MoreThan(processedTillTimestamp),
      },
      order: {
        timestamp: "ASC",
      },
    });
    console.log(`Found ${res.length} unprocessed sale records`);
    return res;
  }
}
