import { Session } from "@chromia/ft4";
import { DynamicStructuredTool, DynamicTool, tool } from "langchain";
import { ChromiaService } from "src/chromia/chromia.service";
import * as z from "zod";
import { tool_descriptions, tool_names } from "./tools.constant";
import { Injectable } from "@nestjs/common";
import { ops } from "src/chromia/chromia.constants";
import { bigintReplacer } from "./tools.helper";

@Injectable()
export class ToolService {
  constructor(private readonly chromiaService: ChromiaService) {}
  getAllTools(session: Session): DynamicStructuredTool[] {
    return [
      this.getAllShopListings(session),
      this.doesPlayerOwnItem(session),
      this.getFT4Inventory(session),
      this.buyItems(session),
    ];
  }
  getAllShopListings(session: Session) {
    return tool(
      async () => {
        return JSON.stringify(
          await this.chromiaService.get_all_shop_listings(session),
          bigintReplacer,
        );
      },
      {
        name: tool_names.GET_ALL_SHOP_LISTINGS,
        description: tool_descriptions.GET_ALL_SHOP_LISTINGS,
        schema: z.object({}),
      },
    );
  }
  doesPlayerOwnItem(session: Session) {
    return tool(
      async (args) => {
        return JSON.stringify(
          await this.chromiaService.does_player_own_item(
            session,
            args["asset_name"],
          ),
          bigintReplacer,
        );
      },
      {
        name: tool_names.DOES_PLAYER_OWN_ITEM,
        description: tool_descriptions.DOES_PLAYER_OWN_ITEM,
        schema: z.object({
          asset_name: z.string().describe("The name of the asset/item"),
        }),
      },
    );
  }
  getFT4Inventory(session: Session) {
    return tool(
      async () => {
        return JSON.stringify(
          await this.chromiaService.get_ft4_inventory(session),
          bigintReplacer,
        );
      },
      {
        name: tool_names.GET_FT4_INVENTORY,
        description: tool_descriptions.GET_FT4_INVENTORY,
        schema: z.object({}),
      },
    );
  }
  buyItems(session: Session) {
    return tool(
      async (args) => {
        return JSON.stringify(
          await this.chromiaService.callOperation(session, ops.BUY_ITEMS, [
            args["shop_name"],
            args["items"],
          ]),
          bigintReplacer,
        );
      },
      {
        name: tool_names.BUY_ITEMS,
        description: tool_descriptions.BUY_ITEMS,
        schema: z.object({
          shop_name: z
            .string()
            .describe(`The name of the shop to buy from, e.g. 'general_store'`),
          items: z
            .record(z.string(), z.number())
            .describe(`A map of item name to quantity`),
        }),
      },
    );
  }
}
/**
 *   {
     name: tool_names.BUY_ITEMS,
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
 */
