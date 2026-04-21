import { Module } from "@nestjs/common";
import { ChromiaService } from "src/chromia/chromia.service";
import { ListenerService } from "./listener.service";
import { AssetService } from "src/assets/assets.service";

@Module({
  imports: [AssetService, ChromiaService],
  providers: [ListenerService],
  // exports: [],
})
export class ListenerModule {}
