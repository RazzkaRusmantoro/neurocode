/**
 * Base types for the multi-agent system
 */

export interface AgentMessage {
  from: string;
  to: string;
  type: 'request' | 'response' | 'error';
  payload: any;
  timestamp: Date;
}

export interface AgentState {
  id: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  currentTask?: string;
  error?: string;
}

export interface AgentContext {
  requestId: string;
  repositoryId: string;
  userId: string;
  scope: 'file' | 'module' | 'repository';
  target?: string; // file path, module name, or 'full' for repository
}

export abstract class BaseAgent {
  abstract name: string;
  abstract execute(context: AgentContext, input?: any): Promise<any>;
  
  protected sendMessage(to: string, type: AgentMessage['type'], payload: any): AgentMessage {
    return {
      from: this.name,
      to,
      type,
      payload,
      timestamp: new Date(),
    };
  }
}

