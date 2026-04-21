import { Module } from "@nestjs/common";
import { ToolService } from "./tools.service";
import { ChromiaModule } from "src/chromia/chromia.module";
@Module({
  imports: [ChromiaModule],
  providers: [ToolService],
  exports: [ToolService],
})
export class ToolModule {}
