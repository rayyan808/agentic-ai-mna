import { asset_info } from "src/assets/assets.constant";
import { AssetService } from "src/assets/assets.service";
import { AssetInfo } from "src/assets/entities/asset.entity";

export class CacheHelper {
  async cacheHitOrPopulate(
    assetService: AssetService,
    cacheMap: Map<string, Map<string, asset_info>>,
    asset_name: string,
    currency: string,
  ): Promise<asset_info> {
    let assetCache = cacheMap.get(asset_name);
    if (assetCache) {
      let asset_info = assetCache.get(currency);
      if (asset_info) {
        return asset_info;
      } else {
        return await this.cacheAssetInfo(
          assetService,
          cacheMap,
          asset_name,
          currency,
        );
      }
    } else {
      return await this.cacheAssetInfo(
        assetService,
        cacheMap,
        asset_name,
        currency,
      );
    }
  }
  async cacheAssetInfo(
    assetService: AssetService,
    cacheMap: Map<string, Map<string, asset_info>>,
    asset_name: string,
    currency: string,
  ): Promise<asset_info> {
    let asset_info = await assetService.getAssetInfo(asset_name, currency);
    cacheMap.set(
      asset_name,
      new Map<string, asset_info>().set(currency, asset_info),
    );
    return asset_info;
  }

  setAssetInfo(
    cacheMap: Map<string, Map<string, asset_info>>,
    asset_name: string,
    currency: string,
    asset_info: asset_info,
  ) {
    cacheMap.get(asset_name).set(currency, asset_info);
  }

  async dumpCache(
    assetService: AssetService,
    cacheMap: Map<string, Map<string, asset_info>>,
  ) {
    let rows: Array<AssetInfo> = [];
    for (let [asset_name, currencyCache] of cacheMap.entries()) {
      for (let [currency, asset_info] of currencyCache.entries()) {
        rows.push({ asset_name, currency, ...asset_info });
      }
    }
    await assetService.bulkInsert(rows);
    cacheMap.clear();
  }
}
