import { InjectRepository } from "@nestjs/typeorm";
import { AaveV3Config } from "./aavev3.entity";
import { Repository } from "typeorm";
import { ChainConfigs } from "./aavev3.config";

export class AaveV3Service {
  constructor(
    @InjectRepository(AaveV3Config)
    private configService: Repository<AaveV3Config>,
  ) {}

  async getLastProcessedBlock(chain: string): Promise<number> {
    try {
      const block = await this.configService.findOneOrFail({
        where: {
          chain,
        },
      });
      return block.lastProcessedBlock;
    } catch (e) {
      console.log(
        `No blocks processed yet for ${chain} on AAVE V3. Creating config..`,
      );
      const config = ChainConfigs[chain];
      await this.configService.insert([
        {
          chain: config.chain,
          lastProcessedBlock: config.startBlock,
        },
      ]);
      return config.startBlock;
    }
  }
}
