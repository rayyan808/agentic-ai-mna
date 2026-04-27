import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Token } from "./token.entity";
import * as config from "./token.config.json";
export class TokenService {
  constructor(@InjectRepository(Token) private tokenRepo: Repository<Token>) {}

  async onModuleInit() {
    console.log(`Upserting Token Data..`);
    await this.tokenRepo.upsert(config, ["name"]);
  }

  async getToken(name: string): Promise<Token> {
    return await this.tokenRepo.findOne({
      where: {
        name: name.toUpperCase(),
      },
    });
  }
}
