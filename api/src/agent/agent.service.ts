import { Injectable } from "@nestjs/common";
import { MessageEvent } from "@nestjs/common";
import { createClient, newSignatureProvider } from "postchain-client";
import { getBalancesByAccountId } from "@chromia/ft4";
import { Subject } from "rxjs";
import Anthropic from "@anthropic-ai/sdk";
import { ChromiaService } from "src/chromia/chromia.service";
import { SYSTEM_PROMPT, TOOLS } from "./agent.constants";

@Injectable()
export class AgentService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private chromiaClient: any = null;
  chromiaService: ChromiaService;

  private async getChromiaClient() {
    if (this.chromiaClient) return this.chromiaClient;
    const nodeUrl = process.env.CHROMIA_NODE_URL;
    const brid = process.env.CHROMIA_BRID;
    if (!nodeUrl || !brid) {
      throw new Error("Set CHROMIA_NODE_URL and CHROMIA_BRID in api/.env");
    }
    this.chromiaClient = await createClient({
      nodeUrlPool: [nodeUrl],
      blockchainRid: brid,
    });
    return this.chromiaClient;
  }

  private async executeTool(toolName: string, toolInput: any) {
    const client = await this.getChromiaClient();
    if (toolName === "get_ft4_inventory") {
      const player_assets = await this.chromiaService.get_ft4_inventory(
        client,
        toolInput.account_id,
      );

      return { success: true, player_assets };
    }

    if (toolName === "buy_items") {
      const signatureProvider = newSignatureProvider({
        privKey: process.env.AGENT_WALLET_KEY,
      });
      const txID = this.chromiaService.callOperation(
        client,
        signatureProvider,
        "shop.buy_items",
        [toolInput.shop_name, toolInput.items],
      );
      return {
        success: true,
        txID,
        purchased: toolInput.items,
        shop: toolInput.shop_name,
        note: "buy_items requires a signed wallet session — connect MetaMask via ft4 to execute real transactions",
      };
    }

    return { success: false, error: "Unknown tool" };
  }

  async runAgent(
    goal: string,
    accountId: string,
    subject: Subject<MessageEvent>,
  ) {
    const emit = (data: object) => subject.next({ data } as MessageEvent); //emit == send message event to the chat

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: `Account ID: ${accountId}\n\nGoal: ${goal}` },
    ];

    const MAX_ITERATIONS = 10;
    let iteration = 0;

    try {
      while (iteration < MAX_ITERATIONS) {
        iteration++;

        const response = await this.anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          tool_choice: { type: "auto" },
          messages,
        });

        const textBlock = response.content.find((b) => b.type === "text") as
          | Anthropic.TextBlock
          | undefined;

        if (textBlock?.text) {
          emit({ type: "thought", text: textBlock.text });
        }

        if (response.stop_reason !== "tool_use") {
          emit({ type: "done", text: textBlock?.text ?? "Goal complete." });
          subject.complete();
          return;
        }

        const toolUseBlocks = response.content.filter(
          (b) => b.type === "tool_use",
        ) as Anthropic.ToolUseBlock[];

        messages.push({ role: "assistant", content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          emit({ type: "tool_call", name: toolUse.name, input: toolUse.input });

          const result = await this.executeTool(toolUse.name, toolUse.input);

          emit({ type: "tool_result", name: toolUse.name, result });

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        messages.push({ role: "user", content: toolResults });
      }

      emit({ type: "done", text: "Reached maximum iteration limit." });
    } catch (err) {
      emit({ type: "error", text: `${err}` });
    }

    subject.complete();
  }
}
