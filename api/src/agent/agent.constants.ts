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
    name: "player.get_ft4_inventory",
    description:
      "Query the player's current on-chain inventory. Returns a list of {name: string, amount: integer} where name is the name of the asset, and the amount defines how many of the asset the user currently owns. Call this first to understand what the player currently has.",
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
    name: "shop.buy_items",
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
