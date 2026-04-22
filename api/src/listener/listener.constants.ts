import { asset_info } from "src/assets/assets.constant";

export type AssetCache = Map<string, Map<string, asset_info>>;

export enum ListenerState {
  ready,
  fetching,
  processing,
}
export const currencyDecimals = {
  ALICE: 6,
  BJORN: 1,
};
