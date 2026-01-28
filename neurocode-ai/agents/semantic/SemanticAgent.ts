import { Agent } from '../base/Agent';
import { AgentContext } from '../../types/agent';
import { ClaudeService } from '../../services/llm/ClaudeService';

/**
 * Semantic Agent: Generates documentation using LLM
 */
export class SemanticAgent extends Agent {
  name = 'SemanticAgent';
  private claudeService: ClaudeService;

  constructor() {
    super();
    this.claudeService = new ClaudeService();
    this.initializeState();
  }

  /**
   * Generate documentation
   */
  async execute(
    context: AgentContext,
    input?: {
      structure: any;
      context: Array<{ path: string; content: string; language: string }>;
    }
  ): Promise<string> {
    console.log(`[SemanticAgent] Starting documentation generation for scope: ${context.scope}`);
    this.setState({ status: 'processing', currentTask: 'Generating documentation' });

    try {
      if (!input?.structure) {
        throw new Error('Structure data is required for documentation generation');
      }

      const startTime = Date.now();
      const structureInfo = {
        files: input.structure.files?.length || 0,
        functions: input.structure.functions?.length || 0,
        classes: input.structure.classes?.length || 0,
        contextFiles: input.context?.length || 0,
      };
      console.log(`[SemanticAgent] Input: ${structureInfo.files} files, ${structureInfo.functions} functions, ${structureInfo.classes} classes, ${structureInfo.contextFiles} context files`);

      // Generate documentation using Claude
      console.log(`[SemanticAgent] Calling Claude API...`);
      const documentation = await this.claudeService.generateDocumentation(
        input.structure,
        input.context || [],
        context.scope,
        context.target
      );

      const generationTime = Date.now() - startTime;
      console.log(`[SemanticAgent] ✓ Documentation generated in ${generationTime}ms (${documentation.length} characters)`);

      this.setState({ status: 'completed' });

      return documentation;
    } catch (error) {
      this.handleError(error as Error, context);
      throw error;
    }
  }
}

