import { InjectRepository } from "@nestjs/typeorm";
import { SaleRecord } from "../entities/sale.entity";
import { Repository } from "typeorm";
import { Sale } from "./sale_record.dto";

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
}
