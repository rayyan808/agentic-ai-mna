import { Repository } from "typeorm";
import { MovingAverage, Sale, TimePeriod } from "./sale_record.dto";
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
  async getMovingAverage(
    asset_name: string,
    token_name: string,
    bucket_size: TimePeriod,
    time_window: TimePeriod,
  ): Promise<MovingAverage[]> {
    const x = await this.saleRepo.query<MovingAverage[]>(
      `
      SELECT 
        time_bucket($1::interval, s.timestamp) as bucket,
        locf(SUM(s.price) / NULLIF(SUM(s.units), 0)) as avg_price
      FROM sale_record s
      WHERE s.timestamp > now() - $1::interval
        AND s.asset_name = $2
        AND s.token_name = $3
      GROUP BY bucket
      ORDER BY bucket
      `,
      [bucket_size, time_window, asset_name, token_name],
    );
    console.log(`Got bucket: ${JSON.stringify(x, null, 3)}`);
    return x;
  }
  async getRecords(fromDate: Date, toDate: Date): Promise<SaleRecord[]> {
    const x = this.saleRepo.query(
      `
      SELECT * 
      FROM sale_record s
      WHERE s.timestamp > $1
        AND s.timestamp < $2
      ORDER BY timestamp ASC
      `,
      [fromDate, toDate],
    );
    return x;
  }
}
