import { Module } from "@nestjs/common";
import { ToolService } from "./tools.service";
import { ChromiaModule } from "src/chromia/chromia.module";
import { AssetModule } from "src/assets/assets.module";
@Module({
  imports: [ChromiaModule, AssetModule],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
