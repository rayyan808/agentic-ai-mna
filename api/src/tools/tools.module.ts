import { Module } from "@nestjs/common";
import { ToolService } from "./tools.service";
import { ChromiaModule } from "src/chromia/chromia.module";
import { AssetModule } from "src/assets/assets.module";
import { FinanceModule } from "src/finance/finance.module";
@Module({
  imports: [ChromiaModule, AssetModule, FinanceModule],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
