import { Controller, MessageEvent, Query, Sse } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';
import { AgentService } from './agent.service';

@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Sse('run')
  run(
    @Query('goal') goal: string,
    @Query('accountId') accountId: string,
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    this.agentService.runAgent(goal, accountId, subject);
    return subject.asObservable();
  }
}
