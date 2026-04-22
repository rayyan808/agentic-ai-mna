import { Module } from "@nestjs/common";
import { FinanceService } from "./finance.service";
import { AssetModule } from "src/assets/assets.module";
import { SaleRecordModule } from "src/sale_record/sale_record.module";
import { FinanceConfig } from "./finance.entity";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    TypeOrmModule.forFeature([FinanceConfig]),
    AssetModule,
    SaleRecordModule,
  ],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
