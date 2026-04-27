import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class Token {
  @PrimaryColumn()
  name: string;

  @Column()
  decimals: number;
}
