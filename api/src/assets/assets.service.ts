import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AssetInfo } from "./entities/asset.entity";
import { Repository } from "typeorm";
import { SaleRecord } from "../listener/entities/sale.entity";
import { asset_info } from "./assets.constant";

@Injectable()
export class AssetService {
  constructor(
    @InjectRepository(AssetInfo) private assetRepo: Repository<AssetInfo>,
  ) {}

  async updateAsset(
    assetName: string,
    currency: string,
    assetInfo: asset_info,
  ) {
    console.log(`Updating asset ${assetName}`);
    const row = await this.assetRepo.findOne({
      where: { asset_name: assetName, currency: currency },
    });
    if (row) {
      //exists
      row.summed_price += assetInfo.summed_price;
      row.summed_units += assetInfo.summed_units;
      await this.assetRepo.save(row);
      console.log(`New TWAP: ${row.summed_price / row.summed_units}`);
    } else {
      console.log(`Asset doesnt exist, creating..`);
      await this.assetRepo.insert({
        asset_name: assetName,
        currency: currency,
        summed_price: assetInfo.summed_price,
        summed_units: assetInfo.summed_units,
      });
    }
  }
}
