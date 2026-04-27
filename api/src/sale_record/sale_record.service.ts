import { MoreThan, QueryBuilder, Repository } from "typeorm";
import { Sale } from "./sale_record.dto";
import { SaleRecord } from "src/sale_record/sale.entity";
import { InjectRepository } from "@nestjs/typeorm";

export class SaleRecordService {
  constructor(
    @InjectRepository(SaleRecord) private saleRepo: Repository<SaleRecord>,
  ) {}
  async insert(data: Sale) {
    await this.saleRepo.insert({
      ...data,
    });
    return;
  }
  //@TODO: Convert to a real-time aggregation
  async getRecords(fromDate: number, toDate: number): Promise<SaleRecord[]> {
    const x = this.saleRepo.query<SaleRecord[]>(
      `
      SELECT 
      `,
    );
    return x;
  }
}
