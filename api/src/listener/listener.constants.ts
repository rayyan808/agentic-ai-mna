export type asset_info = { summed_price: number; summed_units: number };

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
