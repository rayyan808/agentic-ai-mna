import {
  Entity,
  Column,
  Index,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Hypertable, TimeColumn } from "@timescaledb/typeorm";
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

  @Column()
  price: number;

  @Column()
  units: number;

  @Column()
  token_name: string;
}
