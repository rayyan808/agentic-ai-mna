import { Entity, Column, Index, PrimaryColumn } from "typeorm";
import { Hypertable, TimeColumn } from "@timescaledb/typeorm";
@Entity()
@Hypertable({})
@Index(["asset_name", "token_name"])
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
  token_name: string;
}
