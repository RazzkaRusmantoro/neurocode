import { Agent } from '../base/Agent';
import { AgentContext } from '../../types/agent';
import { DependencyGraphBuilder } from '../../services/graph/DependencyGraph';
import { DependencyGraph } from '../../types/repository';

/**
 * Retrieval Agent: Finds relevant code context
 * Simplified version - uses dependency graph instead of vector DB
 */
export class RetrievalAgent extends Agent {
  name = 'RetrievalAgent';
  private graphBuilder: DependencyGraphBuilder;

  constructor() {
    super();
    this.graphBuilder = new DependencyGraphBuilder();
    this.initializeState();
  }

  /**
   * Find relevant code context
   */
  async execute(
    context: AgentContext,
    input?: {
      graph: DependencyGraph;
      structure: any;
      target?: string;
    }
  ): Promise<Array<{ path: string; content: string; language: string }>> {
    console.log(`[RetrievalAgent] Finding relevant context for scope: ${context.scope}, target: ${context.target || 'N/A'}`);
    this.setState({ status: 'processing', currentTask: 'Finding relevant context' });

    try {
      if (!input?.graph || !input?.structure) {
        console.log(`[RetrievalAgent] No graph or structure provided, returning empty context`);
        return [];
      }

      const relatedFiles: string[] = [];

      if (context.scope === 'file' && context.target) {
        // Find files related to the target file
        console.log(`[RetrievalAgent] Finding related files for: ${context.target}`);
        relatedFiles.push(...this.graphBuilder.findRelatedFiles(input.graph, context.target, 2));
        relatedFiles.push(context.target); // Include target file itself
        console.log(`[RetrievalAgent] Found ${relatedFiles.length} related files`);
      } else if (context.scope === 'module' && context.target) {
        // Find all files in the module
        console.log(`[RetrievalAgent] Finding module files for: ${context.target}`);
        const entryFile = input.structure.files.find((f: any) => 
          f.path.includes(context.target || '')
        )?.path;
        if (entryFile) {
          relatedFiles.push(...this.graphBuilder.getModuleFiles(input.graph, entryFile));
          console.log(`[RetrievalAgent] Found ${relatedFiles.length} files in module`);
        } else {
          console.log(`[RetrievalAgent] Entry file not found for module: ${context.target}`);
        }
      } else {
        // For repository scope, get all files
        console.log(`[RetrievalAgent] Repository scope: including all ${input.structure.files.length} files`);
        relatedFiles.push(...input.structure.files.map((f: any) => f.path));
      }

      // Return context chunks (simplified - would normally fetch file contents)
      // For now, return structure info that will be used to fetch contents
      const contextChunks = relatedFiles.map(path => {
        const file = input.structure.files.find((f: any) => f.path === path);
        return {
          path,
          content: '', // Will be populated when files are fetched
          language: file?.language || 'typescript',
        };
      });

      console.log(`[RetrievalAgent] ✓ Returning ${contextChunks.length} context chunks`);
      this.setState({ status: 'completed' });

      return contextChunks;
    } catch (error) {
      this.handleError(error as Error, context);
      return [];
    }
  }
}

