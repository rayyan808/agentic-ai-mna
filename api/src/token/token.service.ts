import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Token } from "./token.entity";
import * as config from "./token.config.json";
export class TokenService {
  tokenCache: Map<string, Token>;
  constructor(@InjectRepository(Token) private tokenRepo: Repository<Token>) {}

  async onModuleInit() {
    console.log(`Upserting Token Data..`);
    let tokens: Token[] = config;
    this.tokenCache = new Map();
    await this.tokenRepo.upsert(tokens, ["name"]); //@TODO: move to service level func, invalidate redis cache on upsert
    tokens.forEach((tokenObj) => {
      this.tokenCache.set(tokenObj.name, tokenObj);
    });
  }

  //@TODO: Add a redis cache hit before checking DB
  async getToken(name: string): Promise<Token> {
    const token = this.tokenCache.get(name);
    if (token) {
      return token;
    }
    const newToken = await this.tokenRepo.findOne({
      where: {
        name: name.toUpperCase(),
      },
    });
    if (newToken) {
      this.tokenCache.set(name, newToken);
    }
    return newToken;
  }
}
