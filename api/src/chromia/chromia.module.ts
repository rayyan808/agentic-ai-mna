import { Module } from "@nestjs/common";
import { ChromiaService } from "./chromia.service";

@Module({
  providers: [ChromiaService],
  exports: [ChromiaService],
})
export class ChromiaModule {}
