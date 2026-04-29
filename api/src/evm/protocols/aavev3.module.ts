import { Module } from "@nestjs/common";
import { AaveV3Service } from "./aavev3.service";

@Module({
  providers: [AaveV3Service],
})
export class AaveProtocolModule {}
