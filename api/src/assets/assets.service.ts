import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Asset } from "./entities/asset.entity";
import { Repository } from "typeorm";
import { asset_info } from "./assets.constant";

@Injectable()
export class AssetService {
  constructor(@InjectRepository(Asset) private assetRepo: Repository<Asset>) {}

  async getAssetData(asset_name): Promise<Asset[]> {
    const res = await this.assetRepo.find({
      where: {
        asset_name,
      },
    });
    return res;
  }
  async getAsset(asset_name: string, currency: string): Promise<Asset> {
    const res = await this.assetRepo.findOneOrFail({
      where: {
        asset_name,
        currency,
      },
    });
    return res;
  }

  async insertNewAsset(
    asset_name: string,
    currency: string,
    ema: number,
    emaUpdatedAt: number,
  ) {
    await this.assetRepo
      .createQueryBuilder()
      .insert()
      .into(Asset)
      .values({ asset_name, currency, ema, emaUpdatedAt })
      .orIgnore()
      .execute();
  }
  async updateAsset(
    assetName: string,
    currency: string,
    assetInfo: asset_info,
  ) {
    await this.assetRepo.upsert(
      [{ asset_name: assetName, currency: currency, ...assetInfo }],
      ["asset_name", "currency"],
    );
  }

  async bulkInsert(assets: Asset[]) {
    console.log(`Bulk inserting ${assets.length} assets..`);
    await this.assetRepo.upsert(assets, ["asset_name", "currency"]);
  }
}
