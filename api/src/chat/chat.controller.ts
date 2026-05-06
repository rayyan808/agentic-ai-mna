import { Body, Controller, Post, Query, Res } from "@nestjs/common";
import { AgentService } from "src/agent/agent.service";
import { Delete, Get, Param } from "@nestjs/common";
import type { Response } from "express";
import { ChatRequestDto } from "./chat.dto";

@Controller("chat")
export class ChatController {
  constructor(private readonly agent: AgentService) {}

  @Get("stream")
  async stream(
    @Query("message") message: string,
    @Query("sessionId") sessionId: string | undefined,
    @Query("privateKey") privateKey: string,
    @Query("model") model: string,
    @Query("evmAddress") evmAddress: string,
    @Res() res: Response,
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();
    (res.socket as import("net").Socket | null)?.setNoDelay(true);

    const send = (event: string, data: unknown) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const gen = this.agent.stream(
      sessionId ?? "default",
      message,
      privateKey,
      model,
      evmAddress,
    );
    try {
      for await (const chunk of gen) {
        send(chunk.type, chunk.data);
        if (chunk.type === "final" || chunk.type === "error") break;
      }
      send("done", "");
    } catch (err) {
      send("error", err instanceof Error ? err.message : String(err));
    } finally {
      await gen.return(undefined);
      res.end();
    }
  }

  @Delete(":sessionId")
  async reset(@Param("sessionId") sessionId: string) {
    await this.agent.reset(sessionId);
    return { ok: true };
  }
}
