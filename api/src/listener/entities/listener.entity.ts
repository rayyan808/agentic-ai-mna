import { Column, Entity, PrimaryColumn } from "typeorm";
import { ListenerState } from "../listener.constants";

@Entity()
export class ListenerConfig {
  @PrimaryColumn()
  version: number;

  @Column()
  lastProcessedRow: number;

  @Column({ type: "enum", enum: ListenerState, default: ListenerState.ready })
  state: ListenerState;
}
