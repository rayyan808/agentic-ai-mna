import { Repository } from "typeorm";
import { Candlestick, Sale, TradeWindow } from "./sale_record.dto";
import { SaleRecord } from "src/sale_record/sale.entity";
import { InjectRepository } from "@nestjs/typeorm";

export class SaleRecordService {
  constructor(
    @InjectRepository(SaleRecord) private saleRepo: Repository<SaleRecord>,
  ) {}

  async onModuleInit() {
    await this.saleRepo.query(`
      CREATE MATERIALIZED VIEW hourly_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('1 hour', time) as bucket,
        asset_name,
        token_name,
        first(price::float, time) as open,
        last(price::float, time) as close,
        min(price::float) as low,
        max(price::float) as high,
        SUM(units) as volume,
        SUM(price::float) as sum_price,
        SUM(units * price::float) as sum_price_volume,
        COUNT(*) as trade_count
      FROM sale_record
      GROUP BY 1, 2, 3  
    `);
    await this.saleRepo.query(`
      CREATE MATERIALIZED VIEW daily_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('24 hours', bucket) as bucket,
        asset_name,
        token_name,
        first(open, bucket) as open,
        last(close, bucket) as close,
        min(low) as low,
        max(high) as high,
        SUM(volume) as volume,
        SUM(price) as sum_price,
        SUM(sum_price_volume) as sum_price_volume,
        COUNT(*) as trade_count
      FROM hourly_trades
      GROUP BY 1, 2, 3
    `);
    await this.saleRepo.query(`
      CREATE MATERIALIZED VIEW weekly_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('7 days', bucket) as bucket,
        asset_name,
        token_name,
        first(open, bucket) as open,
        last(close, bucket) as close,
        min(low) as low,
        max(high) as high,
        SUM(volume) as volume,
        SUM(price) as sum_price,
        SUM(sum_price_volume) as sum_price_volume,
        COUNT(*) as trade_count
      FROM daily_trades
      GROUP BY 1, 2, 3
    `);
    await this.saleRepo.query(`
      CREATE MATERIALIZED VIEW monthly_trades 
      WITH (timescaledb.continuous) AS
      SELECT
        time_bucket('4 weeks', bucket) as bucket,
        asset_name,
        token_name,
        first(open, bucket) as open,
        last(close, bucket) as close,
        min(low) as low,
        max(high) as high,
        SUM(volume) as volume,
        SUM(price) as sum_price,
        SUM(sum_price_volume) as sum_price_volume,
        COUNT(*) as trade_count
      FROM weekly_trades
      GROUP BY 1, 2, 3
    `);
  }
  async insert(data: Sale) {
    await this.saleRepo.insert({
      ...data,
    });
    return;
  }

  async getCandles(
    asset_name: string,
    token_name: string,
    from: Date,
    to: Date,
    tradeWindow: TradeWindow,
  ): Promise<Candlestick[]> {
    return await this.saleRepo.query<Candlestick[]>(
      `
      SELECT 
        bucket,
        asset_name,
        token_name,
        open,
        close,
        low,
        high,
        volume,
        sum_price,
        sum_price_volume,
        trade_count,
        sum_price_volume / volume as vwap,
        sum_price / trade_count as avg_price
      FROM ${tradeWindow.valueOf()}
      WHERE 
        bucket >= $3,
        bucket < $4,
        asset_name = $1,
        token_name = $2
      ORDER BY bucket ASC
    `,
      [asset_name, token_name, from, to],
    );
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
