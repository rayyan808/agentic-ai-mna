import { Module } from "@nestjs/common";
import { AgentService } from "./agent.service";
import { ChromiaModule } from "src/chromia/chromia.module";
import { ToolModule } from "src/tools/tools.module";

@Module({
  imports: [ChromiaModule, ToolModule],
  providers: [AgentService],
  exports: [AgentService],
})
export class AgentModule {}
