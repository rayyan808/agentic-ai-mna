import { Module } from "@nestjs/common";
import { ChatModule } from "./chat/chat.module";
import { ListenerModule } from "./listener/listener.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssetModule } from "./assets/assets.module";
import { AssetInfo } from "./assets/entities/asset.entity";
import { ListenerConfig } from "./listener/entities/listener.entity";
import { SaleRecord } from "./sale_record/sale.entity";
import { ScheduleModule } from "@nestjs/schedule";
import { FinanceModule } from "./finance/finance.module";
import { FinanceConfig } from "./finance/finance.entity";

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) ?? 5432,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [AssetInfo, SaleRecord, ListenerConfig, FinanceConfig],
      //synchronize: true, not compatible w timescale
    }),
    ChatModule,
    AssetModule,
    ListenerModule,
    FinanceModule,
  ],
})
export class AppModule {}
