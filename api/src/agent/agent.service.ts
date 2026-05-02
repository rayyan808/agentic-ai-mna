import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ChromiaService } from "src/chromia/chromia.service";
import { ToolService } from "../tools/tools.service";
import {
  AIMessageChunk,
  createAgent,
  createMiddleware,
  HumanMessage,
} from "langchain";
import { SYSTEM_PROMPT } from "src/tools/tools.constant";
import { Session } from "@chromia/ft4";
import { StreamChunk } from "src/chat/chat.dto";
import { MemorySaver } from "@langchain/langgraph";
import { AgentMiddleware } from "langchain";
import { Agent, contextSchema } from "./agent.schema";

const MAX_SESSIONS = 100;
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AgentService {
  logger: AgentMiddleware;
  private readonly agentCache = new Map<string, { session: Session; agent: Agent; checkpointer: MemorySaver; lastUsed: number }>();

  constructor(
    private readonly chromiaService: ChromiaService,
    private readonly toolService: ToolService,
  ) {
    this.logger = createMiddleware({
      name: "Logger",
      contextSchema: contextSchema,
      beforeAgent: (_, runtime) =>
        console.log(`[Before Agent] ${runtime.context?.evmAddress}`),
      beforeModel: (_, runtime) =>
        console.log(`[Before Model] ${runtime.context?.evmAddress}`),
      afterAgent: (_, runtime) =>
        console.log(`[After Agent] ${runtime.context?.evmAddress}`),
    });
  }

  private findModel(name: string): string {
    //probably should add tempreture and other configs here per-model
    if (name.startsWith("claude")) {
      return "claude-sonnet-4-6";
    } else if (name.startsWith("openAI")) {
      return "openai:gpt-5.4";
    } else if (name.startsWith("Ollama")) {
      return "llama-3.1:8b";
    } else {
      return "claude-sonnet-4-6";
    }
  }
  private async deleteSession(sessionId: string) {
    const entry = this.agentCache.get(sessionId);
    if (!entry) return;
    await entry.checkpointer.deleteThread(sessionId);
    this.agentCache.delete(sessionId);
  }

  private async evictIfNeeded() {
    if (this.agentCache.size < MAX_SESSIONS) return;
    let oldestKey: string | undefined;
    let oldestTime = Infinity;
    for (const [key, entry] of this.agentCache) {
      if (entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }
    if (oldestKey) await this.deleteSession(oldestKey);
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async evictStaleSessions() {
    const cutoff = Date.now() - SESSION_TTL_MS;
    for (const [key, entry] of this.agentCache) {
      if (entry.lastUsed < cutoff) await this.deleteSession(key);
    }
  }

  async reset(sessionId: string) {
    await this.deleteSession(sessionId);
  }

  private async getOrCreateSession(
    sessionId: string,
    model: string,
    privateKey: string,
  ): Promise<{ session: Session; agent: Agent }> {
    if (!this.agentCache.has(sessionId)) {
      await this.evictIfNeeded();
      const userSession = await this.chromiaService.createSession(privateKey);
      const checkpointer = new MemorySaver();
      const userAgent = createAgent({
        model: this.findModel(model),
        systemPrompt: SYSTEM_PROMPT,
        middleware: [this.logger],
        contextSchema,
        tools: this.toolService.getAllTools(userSession),
        checkpointer,
      });
      this.agentCache.set(sessionId, { session: userSession, agent: userAgent, checkpointer, lastUsed: Date.now() });
      console.log(`Agent with session created and cached`);
    } else {
      this.agentCache.get(sessionId)!.lastUsed = Date.now();
    }
    return this.agentCache.get(sessionId)!;
  }

  config(sessionId: string, evmAddress: string) {
    // `thread_id` is how the checkpointer isolates conversations.
    return {
      configurable: { thread_id: sessionId },
      context: { sessionId: sessionId, evmAddress: evmAddress },
    };
  }
  /**
   * Streaming: yields token/tool events as they happen.
   * `streamMode: 'messages'` emits AIMessageChunks directly from the LLM node,
   * which is the cleanest way to stream tokens out of a LangGraph agent.
   */
  async *stream(
    sessionId: string,
    input: string,
    privateKey: string,
    model: string,
    evmAddress: string,
  ): AsyncGenerator<StreamChunk> {
    let finalOutput = "";
    if (!this.agentCache.has(sessionId)) {
      yield { type: "status", data: "initializing" };
    }
    const { agent } = await this.getOrCreateSession(sessionId, model, privateKey);
    try {
      const stream = await agent.stream(
        { messages: [new HumanMessage(input)] } as any,
        {
          ...this.config(sessionId, evmAddress),
          streamMode: ["messages", "updates"],
        },
      );

      for await (const [mode, payload] of stream as AsyncIterable<
        [string, any]
      >) {
        if (mode === "messages") {
          // payload = [MessageChunk, metadata]
          const [chunk, metadata] = payload as [
            AIMessageChunk,
            Record<string, unknown>,
          ];

          if (chunk.type !== "ai") continue;

          const text = this.extractText(chunk?.content);
          if (!text) continue;

          finalOutput += text;
          yield { type: "token", data: text };
        } else if (mode === "updates") {
          // payload = { [nodeName]: { messages: [...] } }
          for (const [node, update] of Object.entries(
            payload as Record<string, any>,
          )) {
            const messages = update?.messages;
            if (!Array.isArray(messages)) continue;

            if (node === "tools") {
              for (const m of messages) {
                if (m?.name) {
                  yield { type: "tool_end", data: m.name };
                }
              }
            } else if (node === "agent") {
              for (const m of messages) {
                const toolCalls = m?.tool_calls ?? [];
                for (const call of toolCalls) {
                  if (call?.name) {
                    yield { type: "tool_start", data: call.name };
                  }
                }
              }
            }
          }
        }
      }

      yield { type: "final", data: finalOutput };
    } catch (err) {
      console.log(err);
      yield {
        type: "error",
        data: err instanceof Error ? err.message : String(err),
      };
    }
  }

  extractText(content: unknown): string {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((c: any) =>
          typeof c === "string" ? c : c?.type === "text" ? (c.text ?? "") : "",
        )
        .join("");
    }
    return "";
  }
}
