import { Column, Entity, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class ListenerConfig {
  @PrimaryColumn()
  version: number;

  @Column()
  lastProcessedRow: string;
}
