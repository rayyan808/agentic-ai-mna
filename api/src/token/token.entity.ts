import { Column, PrimaryColumn } from "typeorm";

export class Token {
  @PrimaryColumn()
  name: string;

  @Column()
  decimals: number;
}
