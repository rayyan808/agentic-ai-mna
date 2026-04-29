import { TimeColumn } from "@timescaledb/typeorm";
import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AaveV3Config {
  @PrimaryColumn()
  chain: string;

  @TimeColumn()
  lastProcessedBlock: number;
}
