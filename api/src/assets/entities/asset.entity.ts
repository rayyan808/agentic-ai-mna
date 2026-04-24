import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AssetInfo {
  @PrimaryColumn()
  asset_name: string;

  @PrimaryColumn()
  currency: string;

  @Column({ type: "double precision" })
  ema: number;

  @Column({
    type: "bigint",
    nullable: true,
    transformer: {
      to: (value: number) => value?.toString(),
      from: (value: string) => (value ? parseInt(value, 10) : 0),
    },
  })
  emaUpdatedAt: number;
}
