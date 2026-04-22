import { Module } from "@nestjs/common";
import { AssetService } from "./assets.service";
import { SaleRecord } from "../listener/entities/sale.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssetInfo } from "./entities/asset.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SaleRecord, AssetInfo])],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
