const queries = {
  GET_ACCOUNT_ID: "evm_exporter.get_account_id",
  GET_PLAYER_ASSETS: "admin.list_assets_by_player",
  DOES_PLAYER_OWN_ITEM: "player.does_player_own_item",
  GET_ALL_SHOP_LISTINGS: "shop.get_all_shop_listings",
  GET_CRAFTING_STATIONS: "recipes.get_stations",
  GET_SALE_RECORDS: "storefronts.get_sale_records",
};

const ops = {
  BUY_ITEMS: "shop.buy_items",
};
type TransactionResult = {
  status: TX_STATUS;
  data: string;
};
enum TX_STATUS {
  SUCCESS,
  FAILED,
}
export { queries, ops, TX_STATUS, TransactionResult };
