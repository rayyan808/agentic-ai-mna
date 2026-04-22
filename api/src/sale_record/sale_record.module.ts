import { Module } from "@nestjs/common";
import { SaleRecordService } from "./sale_record.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SaleRecord } from "./sale.entity";

@Module({
  imports: [TypeOrmModule.forFeature([SaleRecord])],
  providers: [SaleRecordService],
  exports: [SaleRecordService],
})
export class SaleRecordModule {}
