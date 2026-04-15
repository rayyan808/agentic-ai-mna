import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from 'postchain-client';
import { getBalancesByAccountId } from '@chromia/ft4';
import { Subject } from 'rxjs';

const SYSTEM_PROMPT = `You are an autonomous agent for the My Neighbor Alice (MNA) dApp on the Chromia blockchain.

You have access to two tools:
1. get_ft4_inventory — queries the player's on-chain inventory
2. buy_items — executes a purchase from a named shop

When the user gives you a goal, reason step by step, call the appropriate tools in sequence, and report what you did.
Always check inventory before buying. Be concise in your reasoning. When the goal is complete, summarise what was accomplished.

IMPORTANT: You are operating autonomously. Do not ask for confirmation. Execute the goal directly.`;

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_ft4_inventory',
    description:
      "Query the player's current on-chain inventory. Returns a list of assets with name and amount. Call this first to understand what the player currently has.",
    input_schema: {
      type: 'object',
      properties: {
        account_id: {
          type: 'string',
          description: "The player's account ID as a hex string (byte_array)",
        },
      },
      required: ['account_id'],
    },
  },
  {
    name: 'buy_items',
    description:
      'Purchase items from a named shop on the MNA dApp. Specify the shop name and a map of item names to quantities.',
    input_schema: {
      type: 'object',
      properties: {
        shop_name: {
          type: 'string',
          description: "The name of the shop to buy from, e.g. 'general_store'",
        },
        items: {
          type: 'object',
          description:
            "A map of item name to quantity, e.g. { 'carrot_seed': 10, 'water_bucket': 5 }",
          additionalProperties: { type: 'integer' },
        },
      },
      required: ['shop_name', 'items'],
    },
  },
];

@Injectable()
export class AgentService {
  private anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private chromiaClient: any = null;

  private async getChromiaClient() {
    if (this.chromiaClient) return this.chromiaClient;
    const nodeUrl = process.env.CHROMIA_NODE_URL;
    const brid = process.env.CHROMIA_BRID;
    if (!nodeUrl || !brid) {
      throw new Error('Set CHROMIA_NODE_URL and CHROMIA_BRID in api/.env');
    }
    this.chromiaClient = await createClient({
      nodeUrlPool: [nodeUrl],
      blockchainRid: brid,
    });
    return this.chromiaClient;
  }

  private async executeTool(toolName: string, toolInput: any) {
    if (toolName === 'get_ft4_inventory') {
      const client = await this.getChromiaClient();
      const accountId = Buffer.from(toolInput.account_id, 'hex');
      const result = await getBalancesByAccountId(client, accountId);
      const balances = result.data.map((b: any) => ({
        name: b.asset.name,
        symbol: b.asset.symbol,
        amount: b.amount.toString(),
      }));
      return { success: true, balances };
    }

    if (toolName === 'buy_items') {
      // TODO: session.call(op("buy_items", ...)) — requires MetaMask + ft4 wallet session
      const tx_rid = '0x' + Math.random().toString(16).slice(2, 18).toUpperCase();
      return {
        success: true,
        tx_rid,
        purchased: toolInput.items,
        shop: toolInput.shop_name,
        note: 'buy_items requires a signed wallet session — connect MetaMask via ft4 to execute real transactions',
      };
    }

    return { success: false, error: 'Unknown tool' };
  }

  async runAgent(goal: string, accountId: string, subject: Subject<MessageEvent>) {
    const emit = (data: object) => subject.next({ data } as MessageEvent);

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: `Account ID: ${accountId}\n\nGoal: ${goal}` },
    ];

    const MAX_ITERATIONS = 10;
    let iteration = 0;

    try {
      while (iteration < MAX_ITERATIONS) {
        iteration++;

        const response = await this.anthropic.messages.create({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          system: SYSTEM_PROMPT,
          tools: TOOLS,
          tool_choice: { type: 'auto' },
          messages,
        });

        const textBlock = response.content.find((b) => b.type === 'text') as
          | Anthropic.TextBlock
          | undefined;

        if (textBlock?.text) {
          emit({ type: 'thought', text: textBlock.text });
        }

        if (response.stop_reason !== 'tool_use') {
          emit({ type: 'done', text: textBlock?.text ?? 'Goal complete.' });
          subject.complete();
          return;
        }

        const toolUseBlocks = response.content.filter(
          (b) => b.type === 'tool_use',
        ) as Anthropic.ToolUseBlock[];

        messages.push({ role: 'assistant', content: response.content });

        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const toolUse of toolUseBlocks) {
          emit({ type: 'tool_call', name: toolUse.name, input: toolUse.input });

          const result = await this.executeTool(toolUse.name, toolUse.input);

          emit({ type: 'tool_result', name: toolUse.name, result });

          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
          });
        }

        messages.push({ role: 'user', content: toolResults });
      }

      emit({ type: 'done', text: 'Reached maximum iteration limit.' });
    } catch (err) {
      emit({ type: 'error', text: err.message });
    }

    subject.complete();
  }
}
