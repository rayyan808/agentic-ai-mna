import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { AgentModule } from "src/agent/agent.module";

@Module({
  imports: [AgentModule],
  controllers: [ChatController],
})
export class ChatModule {}
