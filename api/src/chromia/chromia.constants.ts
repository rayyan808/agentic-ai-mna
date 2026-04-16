const GET_FT4_INVENTORY = "player.get_ft4_inventory";
const GET_ALL_SHOP_LISTINGS = "shop.get_all_shop_listings";
const BUY_ITEMS = "shop.buy_items";
const GET_CRAFTING_STATIONS = "recipes.get_stations";
interface player_asset_info {
  name: string;
  amount: BigInteger;
  [key: string]: any; // Index signature for GTV compatibility
}
interface shop_listing {
  shop_name: string;
  sold_item: string;
  sold_amount: number;
  enabled: boolean;
  sort_order: number;
  partner: string;
  revenue_share_percentage: number;
  variant_group: string;
  variant_group_order: number;
  price_type: string;
  price_currency: string;
  price_amount: number;
  [key: string]: any;
}
interface crafting_station {
  id: Buffer;
  name: string;
  amount: number;
  public: boolean;
  queued_recipes: Array<queued_recipe>;
  [key: string]: any;
}
interface queued_recipe {
  recipe_name: string;
  amount: number;
  time_to_claim: number;
  resulting_token: Buffer;
  resulting_name: string;
  resulting_amount: number;
  location: location;
  griddable_id: Buffer;
  alice_collateral: number;
  [key: string]: any;
}
interface location {
  x: number;
  y: number;
}
enum TX_STATUS {
  SUCCESS,
  FAILED,
}
