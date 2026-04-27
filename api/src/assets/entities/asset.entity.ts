import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class AssetInfo {
  @PrimaryColumn()
  asset_name: string;

  @PrimaryColumn()
  currency: string;
}
