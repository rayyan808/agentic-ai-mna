import { Module } from "@nestjs/common";
import { ListenerService } from "./listener.service";
import { AssetModule } from "src/assets/assets.module";
import { ChromiaModule } from "src/chromia/chromia.module";
import { ListenerConfig } from "./entities/listener.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forFeature([ListenerConfig]),
    AssetModule,
    ChromiaModule,
  ],
  providers: [ListenerService],
  // exports: [],
})
export class ListenerModule {}
