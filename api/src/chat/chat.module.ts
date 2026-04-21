import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { AgentService } from "src/agent/agent.service";
import { AgentModule } from "src/agent/agent.module";

@Module({
  imports: [AgentModule],
  controllers: [ChatController],
})
export class ChatModule {}
