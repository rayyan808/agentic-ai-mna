const queries = {
  GET_FT4_INVENTORY: "player.get_ft4_inventory",
  GET_ALL_SHOP_LISTINGS: "shop.get_all_shop_listings",
  GET_CRAFTING_STATIONS: "recipes.get_stations",
};
const ops = {
  BUY_ITEMS: "shop.buy_items",
};

enum TX_STATUS {
  SUCCESS,
  FAILED,
}
export { queries, ops, TX_STATUS };
