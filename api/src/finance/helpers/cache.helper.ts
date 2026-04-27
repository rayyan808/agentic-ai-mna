import { asset_info } from "src/assets/assets.constant";
import { AssetService } from "src/assets/assets.service";
import { Asset } from "src/assets/entities/asset.entity";

export class CacheHelper {
  async cacheHitOrPopulate(
    assetService: AssetService,
    cacheMap: Map<string, Map<string, asset_info>>,
    asset_name: string,
    token_name: string,
  ): Promise<asset_info> {
    let assetCache = cacheMap.get(asset_name);
    if (assetCache) {
      let asset_info = assetCache.get(token_name);
      if (asset_info) {
        return asset_info;
      } else {
        return await this.cacheAsset(
          assetService,
          cacheMap,
          asset_name,
          token_name,
        );
      }
    } else {
      return await this.cacheAsset(
        assetService,
        cacheMap,
        asset_name,
        token_name,
      );
    }
  }
  async cacheAsset(
    assetService: AssetService,
    cacheMap: Map<string, Map<string, asset_info>>,
    asset_name: string,
    token_name: string,
  ): Promise<asset_info> {
    let asset_info = await assetService.getAsset(asset_name, token_name);
    cacheMap.set(
      asset_name,
      new Map<string, asset_info>().set(token_name, asset_info),
    );
    return asset_info;
  }

  setAsset(
    cacheMap: Map<string, Map<string, asset_info>>,
    asset_name: string,
    token_name: string,
    asset_info: asset_info,
  ) {
    cacheMap.get(asset_name).set(token_name, asset_info);
  }

  async dumpCache(
    assetService: AssetService,
    cacheMap: Map<string, Map<string, asset_info>>,
  ) {
    let rows: Array<Asset> = [];
    for (let [asset_name, currencyCache] of cacheMap.entries()) {
      for (let [token_name, asset_info] of currencyCache.entries()) {
        rows.push({ asset_name, token_name, ...asset_info });
      }
    }
    await assetService.bulkInsert(rows);
    cacheMap.clear();
  }
}
