import { Entity, Column, Index, PrimaryGeneratedColumn } from "typeorm";
import { Hypertable, TimeColumn } from "@timescaledb/typeorm";
import Decimal from "decimal.js";
import { DecimalTransformer } from "src/lib/decimal.helper";
import { Transform } from "class-transformer";
@Entity("sale_record")
@Hypertable({})
@Index(["asset_name", "token_name"])
export class SaleRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @TimeColumn()
  timestamp: Date;

  @Column()
  asset_name: string;

  @Column({
    type: "decimal",
    precision: 40,
    scale: 20,
    transformer: new DecimalTransformer(),
  })
  price: Decimal;

  @Column()
  units: number;

  @Column()
  token_name: string;
}
