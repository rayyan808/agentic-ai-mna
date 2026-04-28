import { Column, Decimal128, Entity, PrimaryColumn } from "typeorm";
import { Decimal } from "decimal.js";
import { DecimalTransformer } from "src/lib/decimal.helper";

@Entity()
export class Asset {
  @PrimaryColumn()
  asset_name: string;

  @PrimaryColumn()
  token_name: string;
}
