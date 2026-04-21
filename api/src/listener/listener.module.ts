import { Module } from "@nestjs/common";
import { ChromiaService } from "src/chromia/chromia.service";
import { ListenerService } from "./listener.service";

@Module({
  imports: [ChromiaService],
  providers: [ListenerService],
  // exports: [],
})
export class ListenerModule {}
