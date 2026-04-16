import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You are an autonomous agent for the My Neighbor Alice (MNA) dApp on the Chromia blockchain.

You have access to two tools:
1. get_ft4_inventory — queries the player's on-chain inventory
2. buy_items — executes a purchase from a named shop

When the user gives you a goal, reason step by step, call the appropriate tools in sequence, and report what you did.
Always check inventory before buying. Be concise in your reasoning. When the goal is complete, summarise what was accomplished.

IMPORTANT: You are operating autonomously. Do not ask for confirmation. Execute the goal directly.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: GET_FT4_INVENTORY,
    description: `This is a query. It returns all FT4 token names that a user owns, alongside the amount of each owned.
      FT4 is a token standard we use, every FT4 token has a unique name that we identify it using.
      Returns a list of {name: string, amount: integer} where name is the name of the asset, 
      amount defines how many of the asset the user currently owns. 
      Call this first to understand what the player currently has.`,
    input_schema: {
      type: "object",
      properties: {
        account_id: {
          type: "string",
          description: "The player's account ID as a hex string (byte_array)",
        },
      },
      required: ["account_id"],
    },
  },
  {
    name: GET_ALL_SHOP_LISTINGS,
    description: `This is a query. Get all items for sale. Returns a list of 
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
    }
      The shop_name refers to the shop where this item is listed for sale, we need this to input into buy_items
      price_amount defines the cost of the item we must pay in terms of FT4 tokens
      price_currency is the name of the FT4 token we must pay in 
    `,
    input_schema: null,
  },
  {
    name: BUY_ITEMS,
    description:
      "Purchase items from a named shop. Specify the shop name and a map of item names to quantities. This is an operation and therefore returns only a transaction ID on success",
    input_schema: {
      type: "object",
      properties: {
        shop_name: {
          type: "string",
          description: "The name of the shop to buy from, e.g. 'general_store'",
        },
        items: {
          type: "object",
          description:
            "A map of item name to quantity, e.g. { 'carrot_seed': 10, 'water_bucket': 5 }",
          additionalProperties: { type: "integer" },
        },
      },
      required: ["shop_name", "items"],
    },
  },
];
export { TOOLS, SYSTEM_PROMPT };
