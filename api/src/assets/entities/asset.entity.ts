import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AssetInfo {
  @PrimaryColumn()
  asset_name: string;

  @PrimaryColumn()
  currency: string;

  @Column()
  ema: number;

  @Column({ type: "bigint", nullable: true })
  emaUpdatedAt: number;
}
