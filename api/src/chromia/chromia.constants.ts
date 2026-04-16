const GET_FT4_INVENTORY = "player.get_ft4_inventory";
const GET_ALL_SHOP_LISTINGS = "shop.get_all_shop_listings";
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
