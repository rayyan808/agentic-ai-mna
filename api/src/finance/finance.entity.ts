import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class FinanceConfig {
  @PrimaryColumn()
  version: number;

  @Column({ type: "bigint", default: 0 })
  latestTimestamp: number;
}
