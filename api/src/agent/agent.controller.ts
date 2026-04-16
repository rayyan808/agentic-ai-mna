import { Controller, MessageEvent, Query, Sse } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { AgentService } from "./agent.service";

@Controller("agent")
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  /**
   * Run a server-side-event that the frontend listens to for every chat message and tool exec
   */
  @Sse("run")
  run(
    @Query("goal") goal: string,
    @Query("privateKey") privateKey: string,
    @Query("evm_address") evmAddress: string,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    this.agentService.runAgent(goal, privateKey, evmAddress, subject);
    return subject.asObservable();
  }
}
