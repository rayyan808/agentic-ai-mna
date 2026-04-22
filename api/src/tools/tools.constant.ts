const SYSTEM_PROMPT = `You are an autonomous agent for the My Neighbor Alice (MNA) dApp on the Chromia blockchain.

Analyze the tools at your disposal.

When the user gives you a goal, reason step by step, call the appropriate tools in sequence.
Be concise in your reasoning, avoid using more words than necessary. Answer with only what is needed, don't hedge.

Always return the TransactionResult from operation calls. 
IMPORTANT: You are operating autonomously. Do not ask for confirmation. Execute the goal directly. `;

const tool_descriptions = {
  DOES_PLAYER_OWN_ITEM: `This is a query that returns a boolean. true if the user owns atleast one instance of the asset name provided`,
  GET_FT4_INVENTORY: `This is a query. It returns all FT4 token names that a user owns, alongside the amount of each owned.
      FT4 is a token standard we use, every FT4 token has a unique name that we identify it using.
      Returns a list of {name: string, amount: integer} where name is the name of the asset, 
      amount defines how many of the asset the user currently owns. 
      Call this first to understand what the player currently has.`,
  GET_ALL_SHOP_LISTINGS: `This is a query. Get all items for sale. Returns a list of {shop_name, price_amount, price_currency} and other attributes that dont concern you
      The shop_name refers to the shop where this item is listed for sale, we need this to input into buy_items
      price_amount defines the cost of the item we must pay in terms of FT4 tokens
      price_currency is the name of the FT4 token we must pay in 
    `,
  BUY_ITEMS: `Purchase items from a named shop. Specify the shop name and a map of item names to quantities. This is an operation and therefore returns only a transaction ID on success`,
  GET_ASSET_FINANCIAL_DATA: `This is a query. For an asset, get it's financial data such as Exponential Moving Average in supported currencies`,
};
const tool_names = {
  //GET_ACCOUNT_ID: "get_account_id",
  DOES_PLAYER_OWN_ITEM: "query_does_player_own_item",
  GET_FT4_INVENTORY: "query_get_ft4_inventory",
  GET_ALL_SHOP_LISTINGS: "query_get_all_shop_listings",
  BUY_ITEMS: "op_buy_items",
  GET_ASSET_FINANCIAL_DATA: "get_asset_financial_data",
};

export { SYSTEM_PROMPT, tool_names, tool_descriptions };
