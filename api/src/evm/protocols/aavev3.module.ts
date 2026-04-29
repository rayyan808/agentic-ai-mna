import { Module } from "@nestjs/common";
import { AaveV3Service } from "./aavev3.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AaveV3Config } from "./aavev3.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AaveV3Config])],
  providers: [AaveV3Service],
})
export class AaveProtocolModule {}
