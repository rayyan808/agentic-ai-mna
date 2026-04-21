import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Timestamp,
  Index,
} from "typeorm";

@Entity()
@Index(["asset_name"])
export class Sale {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  asset_name: string;

  @Column()
  price: number;

  @Column()
  units: number;

  @Column()
  currency: string;

  @Column()
  timestamp: Timestamp;
}
