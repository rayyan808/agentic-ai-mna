import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Asset } from "./entities/asset.entity";
import { Repository } from "typeorm";
import { asset_info } from "./assets.constant";

@Injectable()
export class AssetService {
  constructor(@InjectRepository(Asset) private assetRepo: Repository<Asset>) {}

  async getAssetData(asset_name: string): Promise<Asset[]> {
    const res = await this.assetRepo.find({
      where: {
        asset_name,
      },
    });
    return res;
  }
  async getAsset(asset_name: string, token_name: string): Promise<Asset> {
    const res = await this.assetRepo.findOneOrFail({
      where: {
        asset_name,
        token_name,
      },
    });
    return res;
  }

  async insertNewAsset(
    asset_name: string,
    token_name: string,
    ema: number,
    emaUpdatedAt: number,
  ) {
    await this.assetRepo
      .createQueryBuilder()
      .insert()
      .into(Asset)
      .values({ asset_name, token_name, ema, emaUpdatedAt })
      .orIgnore()
      .execute();
  }

  async updateAsset(
    assetName: string,
    token_name: string,
    assetInfo: asset_info,
  ) {
    await this.assetRepo.upsert(
      [{ asset_name: assetName, token_name, ...assetInfo }],
      ["asset_name", "currency"],
    );
  }

  async bulkInsert(assets: Asset[]) {
    console.log(`Bulk inserting ${assets.length} assets..`);
    await this.assetRepo.upsert(assets, ["asset_name", "currency"]);
  }
}
