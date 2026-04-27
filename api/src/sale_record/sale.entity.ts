import { Entity, Column, Index, PrimaryColumn } from "typeorm";
import { Hypertable, TimeColumn } from "@timescaledb/typeorm";
@Entity()
@Hypertable({})
@Index(["asset_name", "currency"])
export class SaleRecord {
  @TimeColumn()
  timestamp: Date;

  @PrimaryColumn()
  asset_name: string;

  @Column()
  price: number;

  @Column()
  units: number;

  @Column()
  currency: string;
}
