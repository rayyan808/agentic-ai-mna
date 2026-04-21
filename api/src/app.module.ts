import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";
import { ListenerModule } from "./listener/listener.module";

@Module({
  imports: [ChatModule, ListenerModule],
})
export class AppModule {}
