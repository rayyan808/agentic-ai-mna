import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";
import { ListenerModule } from "./listener/listener.module";
import { TypeOrmModule } from "@nestjs/typeorm";
@Module({
  imports: [
    ChatModule,
    ListenerModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) ?? 5163,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [],
    }),
  ],
})
export class AppModule {}
