import { Module } from "@nestjs/common";
import { AgentController } from "./agent.controller";
import { AgentService } from "./agent.service";
import { ChromiaService } from "src/chromia/chromia.service";

@Module({
  imports: [ChromiaService],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
