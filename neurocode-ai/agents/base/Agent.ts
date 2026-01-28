import { BaseAgent, AgentContext, AgentMessage, AgentState } from '../../types/agent';

/**
 * Base Agent class that all agents extend
 */
export abstract class Agent extends BaseAgent {
  protected state: AgentState;

  constructor() {
    super();
    // Initialize state - id will be set when name is available
    this.state = {
      id: '', // Will be updated by initializeState()
      status: 'idle',
    };
  }

  /**
   * Initialize state with agent name (call after name is set)
   */
  protected initializeState(): void {
    this.state.id = this.name;
  }

  /**
   * Execute the agent's main task
   */
  abstract execute(context: AgentContext, input?: any): Promise<any>;

  /**
   * Get current agent state
   */
  getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Update agent state
   */
  protected setState(updates: Partial<AgentState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * Send message to another agent
   */
  protected sendMessage(to: string, type: AgentMessage['type'], payload: any): AgentMessage {
    return {
      from: this.name,
      to,
      type,
      payload,
      timestamp: new Date(),
    };
  }

  /**
   * Handle errors
   */
  protected handleError(error: Error, context: AgentContext): void {
    this.setState({
      status: 'error',
      error: error.message,
    });
    console.error(`[${this.name}] Error:`, error);
  }

  /**
   * Reset agent state
   */
  protected reset(): void {
    this.state = {
      id: this.name,
      status: 'idle',
    };
  }

  /**
   * Get agent name (abstract property accessor)
   */
  protected get agentName(): string {
    return this.name;
  }
}

