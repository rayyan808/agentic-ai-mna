import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AssetInfo } from "./entities/asset.entity";
import { Repository } from "typeorm";
import { asset_info } from "./assets.constant";

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetInfo) private assetRepo: Repository<AssetInfo>,
  ) {}
  async getAssetInfo(asset_name: string, currency: string): Promise<AssetInfo> {
    const res = await this.assetRepo.findOneOrFail({
      where: {
        asset_name,
        currency,
      },
    });
    return res;
  }

  async insertNewAsset(asset_name: string, currency: string) {
    await this.assetRepo
      .createQueryBuilder()
      .insert()
      .into(AssetInfo)
      .values({ asset_name, currency })
      .orIgnore()
      .execute();
  }
  async updateAsset(
    assetName: string,
    currency: string,
    assetInfo: asset_info,
  ) {
    console.log(
      `Updating asset ${assetName} with ${JSON.stringify(assetInfo)}`,
    );
    await this.assetRepo.upsert(
      [{ asset_name: assetName, currency: currency, ...assetInfo }],
      ["asset_name", "currency"],
    );
  }
}
