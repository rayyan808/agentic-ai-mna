import { IsString, IsNotEmpty, IsOptional } from "class-validator";

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  privateKey: string;
}
export type StreamChunk =
  | { type: "token"; data: string }
  | { type: "tool_start"; data: string }
  | { type: "tool_end"; data: string }
  | { type: "final"; data: string }
  | { type: "error"; data: string };
