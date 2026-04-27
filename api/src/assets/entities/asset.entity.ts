import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Asset {
  @PrimaryColumn()
  asset_name: string;

  @PrimaryColumn()
  token_name: string;

  @Column({ type: "double precision" })
  ema: number;

  @Column()
  emaUpdatedAt: Date;
}
