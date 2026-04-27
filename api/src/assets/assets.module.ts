import { Module } from "@nestjs/common";
import { AssetService } from "./assets.service";
import { SaleRecord } from "../sale_record/sale.entity";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Asset } from "./entities/asset.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SaleRecord, Asset])],
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
