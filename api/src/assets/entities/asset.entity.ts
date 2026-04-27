import { Token } from "src/token/token.entity";
import { Entity, JoinColumn, OneToOne, PrimaryColumn } from "typeorm";

@Entity()
export class Asset {
  @PrimaryColumn()
  asset_name: string;

  @OneToOne(() => Token)
  @JoinColumn()
  token: Token;
}
