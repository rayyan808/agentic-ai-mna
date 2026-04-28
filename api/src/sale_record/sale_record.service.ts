import { Repository } from "typeorm";
import { Candlestick, Sale, TradeWindow } from "./sale_record.dto";
import { SaleRecord } from "src/sale_record/sale.entity";
import { InjectRepository } from "@nestjs/typeorm";
import Decimal from "decimal.js";

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

  async getCandles(
    asset_name: string,
    token_name: string,
    from: Date,
    to: Date,
    tradeWindow: TradeWindow,
  ): Promise<Candlestick[]> {
    console.log(
      `Getting ${asset_name}/${token_name} from: ${from} to: ${to} ${tradeWindow.valueOf()}`,
    );
    const rows = await this.saleRepo.query(
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
        bucket >= $3
        AND bucket < $4
        AND asset_name = $1
        AND token_name = $2
      ORDER BY bucket ASC
    `,
      [asset_name, token_name, from, to],
    );
    return rows.map((row: any): Candlestick => ({
      ...row,
      open: new Decimal(row.open),
      close: new Decimal(row.close),
      low: new Decimal(row.low),
      high: new Decimal(row.high),
      sum_price: new Decimal(row.sum_price),
      sum_price_volume: new Decimal(row.sum_price_volume),
      vwap: new Decimal(row.vwap),
      avg_price: new Decimal(row.avg_price),
    }));
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
