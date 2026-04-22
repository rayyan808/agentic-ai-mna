import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
@Index(["asset_name"])
export class SaleRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  asset_name: string;

  @Column()
  price: number;

  @Column()
  units: number;

  @Column()
  currency: string;

  @Column({ type: "bigint", default: () => "0" })
  timestamp: number;
}
