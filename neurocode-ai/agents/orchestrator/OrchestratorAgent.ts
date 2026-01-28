import { Agent } from '../base/Agent';
import { AgentContext } from '../../types/agent';
import { StructuralAgent } from '../structural/StructuralAgent';
import { RetrievalAgent } from '../retrieval/RetrievalAgent';
import { SemanticAgent } from '../semantic/SemanticAgent';

/**
 * Orchestrator Agent: Coordinates the multi-agent workflow
 */
export class OrchestratorAgent extends Agent {
  name = 'OrchestratorAgent';
  private structuralAgent: StructuralAgent;
  private retrievalAgent: RetrievalAgent;
  private semanticAgent: SemanticAgent;

  constructor() {
    super();
    this.structuralAgent = new StructuralAgent();
    this.retrievalAgent = new RetrievalAgent();
    this.semanticAgent = new SemanticAgent();
    this.initializeState();
  }

  /**
   * Handle documentation generation request
   */
  async execute(
    context: AgentContext,
    input?: {
      files: Array<{ path: string; content: string; language: string }>;
    }
  ): Promise<{
    documentation: string;
    metadata: {
      filesAnalyzed: string[];
      functionsDocumented: number;
      classesDocumented: number;
      generationTime: number;
    };
  }> {
    const startTime = Date.now();
    console.log(`[Orchestrator] Starting documentation generation for ${context.scope} scope`);
    console.log(`[Orchestrator] Request ID: ${context.requestId}, Repository: ${context.repositoryId}`);
    
    this.setState({ status: 'processing', currentTask: 'Orchestrating documentation generation' });

    try {
      if (!input?.files || input.files.length === 0) {
        throw new Error('No files provided');
      }

      console.log(`[Orchestrator] Processing ${input.files.length} files`);

      // Step 1: Structural Agent - Analyze code structure
      console.log(`[Orchestrator] Step 1: Analyzing code structure...`);
      this.setState({ currentTask: 'Analyzing code structure' });
      const structuralResult = await this.structuralAgent.execute(context, { files: input.files });
      console.log(`[Orchestrator] ✓ Structure analyzed: ${structuralResult.structure.files.length} files, ${structuralResult.structure.dependencies.length} dependencies`);

      // Step 2: Retrieval Agent - Find relevant context
      console.log(`[Orchestrator] Step 2: Finding relevant code context...`);
      this.setState({ currentTask: 'Finding relevant code context' });
      const contextChunks = await this.retrievalAgent.execute(context, {
        graph: structuralResult.graph,
        structure: structuralResult.structure,
        target: context.target,
      });
      console.log(`[Orchestrator] ✓ Found ${contextChunks.length} relevant context chunks`);

      // Fetch actual file contents for context chunks
      const contextWithContent = contextChunks.map(chunk => {
        const file = input.files.find(f => f.path === chunk.path);
        return {
          path: chunk.path,
          content: file?.content || '',
          language: chunk.language,
        };
      }).filter(chunk => chunk.content); // Only include files with content

      // Step 3: Semantic Agent - Generate documentation
      console.log(`[Orchestrator] Step 3: Generating documentation with ${contextWithContent.length} context files...`);
      this.setState({ currentTask: 'Generating documentation' });
      const documentation = await this.semanticAgent.execute(context, {
        structure: {
          files: structuralResult.structure.files,
          functions: structuralResult.structure.files.flatMap(f => f.functions),
          classes: structuralResult.structure.files.flatMap(f => f.classes),
          dependencies: structuralResult.structure.dependencies,
          insights: structuralResult.insights,
        },
        context: contextWithContent,
      });
      console.log(`[Orchestrator] ✓ Documentation generated (${documentation.length} characters)`);

      // Calculate metadata
      const functionsCount = structuralResult.structure.files.reduce(
        (sum, f) => sum + f.functions.length,
        0
      );
      const classesCount = structuralResult.structure.files.reduce(
        (sum, f) => sum + f.classes.length,
        0
      );

      const generationTime = Date.now() - startTime;

      console.log(`[Orchestrator] ✓ Documentation generation complete in ${generationTime}ms`);
      console.log(`[Orchestrator] Summary: ${functionsCount} functions, ${classesCount} classes documented`);

      this.setState({ status: 'completed' });

      return {
        documentation,
        metadata: {
          filesAnalyzed: structuralResult.structure.files.map(f => f.path),
          functionsDocumented: functionsCount,
          classesDocumented: classesCount,
          generationTime,
        },
      };
    } catch (error) {
      console.error(`[Orchestrator] ✗ Error:`, error);
      this.handleError(error as Error, context);
      throw error;
    }
  }
}

