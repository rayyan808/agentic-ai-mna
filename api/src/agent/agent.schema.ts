import { createAgent } from "langchain";
import z from "zod";

export const contextSchema = z.object({
  sessionId: z.string().describe(`User Session Identifier`),
  evmAddress: z.string().describe(`User EVM Address`),
});

export type Agent = Awaited<ReturnType<typeof createAgent>>;
