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

  @Column({
    type: "bigint",
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => (value ? parseInt(value, 10) : 0),
    },
  })
  timestamp: number;
}
