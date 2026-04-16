import { Injectable } from "@nestjs/common";
import { MessageEvent } from "@nestjs/common";
import {
  createClient,
  newSignatureProvider,
  SignatureProvider,
} from "postchain-client";
import { Subject } from "rxjs";
import Anthropic from "@anthropic-ai/sdk";
import { ChromiaService } from "src/chromia/chromia.service";
import { SYSTEM_PROMPT, tool_names, TOOLS } from "./agent.constants";
import { ops, queries, TX_STATUS } from "src/chromia/chromia.constants";
import {
  createInMemoryEvmKeyStore,
  createKeyStoreInteractor,
  createWeb3ProviderEvmKeyStore,
  Session,
} from "@chromia/ft4";
import { makeKeyPair } from "node_modules/postchain-client/built/src/encryption/encryption";

@Injectable()
export class AgentService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private chromiaClient: any = null;
  constructor(private readonly chromiaService: ChromiaService) {}
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

  private async executeTool(
    session: Session,
    toolName: string,
    toolInput: any,
  ) {
    if (toolName === tool_names.GET_FT4_INVENTORY) {
      const player_assets =
        await this.chromiaService.get_ft4_inventory(session);
      return { success: true, player_assets };
    }
    if (toolName == tool_names.DOES_PLAYER_OWN_ITEM) {
      const owns_asset = await this.chromiaService.does_player_own_item(
        session,
        toolInput.name,
      );
      return { success: true, owns_asset };
    }
    if (toolName == tool_names.GET_ALL_SHOP_LISTINGS) {
      const all_shop_listings = await this.chromiaService.get_all_shop_listings(
        this.chromiaClient,
      );
      return { success: true, all_shop_listings };
    }
    if (toolName === tool_names.BUY_ITEMS) {
      const txStatus = await this.chromiaService.callOperation(
        session,
        ops.BUY_ITEMS,
        [toolInput.shop_name, toolInput.items],
      );
      return {
        success: txStatus == TX_STATUS.SUCCESS,
        purchased: toolInput.items,
        shop: toolInput.shop_name,
      };
    }

    return { success: false, error: "Unknown tool" };
  }

  async runAgent(
    goal: string,
    privateKey: string,
    evmAddress: string,
    subject: Subject<MessageEvent>,
  ) {
    const bigintReplacer = (_: string, v: unknown) =>
      typeof v === "bigint" ? v.toString() : v;
    const emit = (data: object) =>
      subject.next({
        data: JSON.parse(JSON.stringify(data, bigintReplacer)),
      } as MessageEvent);

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: `EVM Address: ${evmAddress}\n\nGoal: ${goal}` },
    ];

    const MAX_ITERATIONS = 10;
    let iteration = 0;
    this.chromiaClient = await this.getChromiaClient();
    try {
      while (iteration < MAX_ITERATIONS) {
        iteration++;

        const response = await this.anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
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

        //Keep da private key out of the model
        const keyPair = makeKeyPair(privateKey);
        const evmKeyStore = createInMemoryEvmKeyStore(keyPair);
        const interactor = createKeyStoreInteractor(
          this.chromiaClient,
          evmKeyStore,
        );
        const accounts = await interactor.getAccounts();
        const account = accounts[0];
        const session = await interactor.getSession(account.id);

        for (const toolUse of toolUseBlocks) {
          emit({ type: "tool_call", name: toolUse.name, input: toolUse.input });

          const result = await this.executeTool(
            session,
            toolUse.name,
            toolUse.input,
          );

          emit({ type: "tool_result", name: toolUse.name, result });

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result, (_, v) =>
              typeof v === "bigint" ? v.toString() : v,
            ),
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
