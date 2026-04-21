import { Module } from "@nestjs/common";
import { AssetService } from "./assets.service";

@Module({
  providers: [AssetService],
  exports: [AssetService],
})
export class AssetModule {}
