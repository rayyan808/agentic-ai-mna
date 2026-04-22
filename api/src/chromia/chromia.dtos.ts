interface player_asset_info {
  name: string;
  amount: bigint;
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
interface paginated_sale_records {
  data: sale_record_dto[];
  row_id: number;
  [key: string]: any;
}
interface sale_record_dto {
  asset_name: string;
  price: bigint;
  units: bigint;
  currency: string;
  timestamp: number;
  rowid: number;
}

export {
  crafting_station,
  queued_recipe,
  location,
  shop_listing,
  player_asset_info,
  paginated_sale_records,
};
