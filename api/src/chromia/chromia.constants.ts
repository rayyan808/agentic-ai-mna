const GET_FT4_INVENTORY = "player.get_ft4_inventory";

interface player_asset_info {
  name: string;
  amount: BigInteger;
  [key: string]: any; // Index signature for GTV compatibility
}
