import { Module } from "@nestjs/common";
import { SaleRecordService } from "./sale_record.service";

@Module({
  providers: [SaleRecordService],
  exports: [SaleRecordService],
})
export class SaleRecordModule {}
