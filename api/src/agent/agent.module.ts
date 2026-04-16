import { Module } from "@nestjs/common";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { ChromiaModule } from "src/chromia/chromia.module";

@Module({
  imports: [ChromiaModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
