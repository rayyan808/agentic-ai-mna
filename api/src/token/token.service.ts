import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Token } from "./token.entity";
import * as config from "./token.config.json";
export class TokenService {
  constructor(@InjectRepository(Token) private tokenRepo: Repository<Token>) {}

  async onModuleInit() {
    console.log(`Upserting Token Data..`);
    let tokens: Token[] = config;
    await this.tokenRepo.upsert(tokens, ["name"]); //@TODO: move to service level func, invalidate redis cache on upsert
  }

  //@TODO: Add a redis cache hit before checking DB
  async getToken(name: string): Promise<Token> {
    return await this.tokenRepo.findOne({
      where: {
        name: name.toUpperCase(),
      },
    });
  }
}
