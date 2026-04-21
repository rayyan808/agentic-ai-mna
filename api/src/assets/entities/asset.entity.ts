import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AssetInfo {
  @PrimaryColumn()
  asset_name: string;

  @PrimaryColumn()
  currency: string;

  @Column()
  summed_price: number;

  @Column()
  summed_units: number;
}
