import { Session } from "@chromia/ft4";
import { DynamicStructuredTool, DynamicTool, tool } from "langchain";
import { ChromiaService } from "src/chromia/chromia.service";
import * as z from "zod";
import { tool_descriptions, tool_names } from "./tools.constant";
import { Injectable } from "@nestjs/common";
import { ops } from "src/chromia/chromia.constants";
import { overflowReplacer } from "./tools.helper";
import { FinanceService } from "src/finance/finance.service";
import { TradeWindow } from "src/sale_record/sale_record.dto";

@Injectable()
export class ToolService {
  constructor(
    private readonly chromiaService: ChromiaService,
    private readonly financeService: FinanceService,
  ) {}
  getAllTools(session: Session): DynamicStructuredTool[] {
    return [
      this.getAllShopListings(session),
      this.doesPlayerOwnItem(session),
      this.getPlayerAssets(session),
      this.buyItems(session),
      this.getFinanceReport(),
      this.getCurrentDate(),
    ];
  }
  getFinanceReport() {
    return tool(
      async (args) => {
        return JSON.stringify(
          await this.financeService.getFinanceReport(
            args["asset_name"],
            args["token_name"],
            args["trade_window"],
            new Date(args["fromDate"]),
            new Date(args["toDate"]),
          ),
          overflowReplacer,
        );
      },
      {
        name: tool_names.GET_FINANCE_REPORT,
        description: tool_descriptions.GET_FINANCE_REPORT,
        schema: z.object({
          asset_name: z.string().describe("Name of the asset"),
          token_name: z
            .string()
            .describe("Name of the currency/token i.e ALICE"),
          trade_window: z
            .enum(TradeWindow)
            .describe("The size of the trading candlesticks i.e weekly"),
          fromDate: z.iso
            .date()
            .describe(
              "Start date in ISO 8601 format, e.g. 2025-01-15T00:00:00Z",
            ),
          toDate: z.iso
            .date()
            .describe("End date in ISO 8601 format, e.g. 2025-01-15T00:00:00Z"),
        }),
      },
    );
  }
  getAllShopListings(session: Session) {
    return tool(
      async () => {
        return JSON.stringify(
          await this.chromiaService.get_all_shop_listings(session),
          overflowReplacer,
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
          overflowReplacer,
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
  getCurrentDate() {
    return tool(
      async () => {
        return JSON.stringify(new Date());
      },
      {
        name: tool_names.GET_CURRENT_DATE,
        description: tool_descriptions.GET_CURRENT_DATE,
        schema: z.object({}),
      },
    );
  }
  getPlayerAssets(session: Session) {
    return tool(
      async () => {
        return JSON.stringify(
          await this.chromiaService.get_player_assets(session),
          overflowReplacer,
        );
      },
      {
        name: tool_names.GET_PLAYER_ASSETS,
        description: tool_descriptions.GET_PLAYER_ASSETS,
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
          overflowReplacer,
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
