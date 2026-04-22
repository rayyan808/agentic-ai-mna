import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class FinanceConfig {
  @PrimaryColumn()
  version: number;

  @Column()
  latestTimestamp: number;
}
