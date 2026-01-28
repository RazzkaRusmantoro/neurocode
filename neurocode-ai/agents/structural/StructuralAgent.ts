import { Agent } from '../base/Agent';
import { AgentContext } from '../../types/agent';
import { ParsedCodeStructure } from '../../types/repository';
import { CodeParser } from '../../services/parser/CodeParser';
import { DependencyGraphBuilder } from '../../services/graph/DependencyGraph';

/**
 * Structural Agent: Analyzes code structure and builds dependency graphs
 */
export class StructuralAgent extends Agent {
  name = 'StructuralAgent';
  private parser: CodeParser;
  private graphBuilder: DependencyGraphBuilder;

  constructor() {
    super();
    this.parser = new CodeParser();
    this.graphBuilder = new DependencyGraphBuilder();
    this.initializeState();
  }

  /**
   * Analyze repository structure
   */
  async execute(context: AgentContext, input?: { files: Array<{ path: string; content: string; language: string }> }): Promise<{
    structure: ParsedCodeStructure;
    graph: any;
    insights: {
      keyComponents: string[];
      modules: string[];
      criticalPaths: string[];
    };
  }> {
    console.log(`[StructuralAgent] Starting analysis of ${input?.files.length || 0} files`);
    this.setState({ status: 'processing', currentTask: 'Analyzing code structure' });

    try {
      if (!input?.files || input.files.length === 0) {
        throw new Error('No files provided for analysis');
      }

      // Parse all files
      console.log(`[StructuralAgent] Parsing ${input.files.length} files...`);
      const structure = this.parser.parseFiles(input.files);
      const totalFunctions = structure.files.reduce((sum, f) => sum + f.functions.length, 0);
      const totalClasses = structure.files.reduce((sum, f) => sum + f.classes.length, 0);
      console.log(`[StructuralAgent] Parsed: ${totalFunctions} functions, ${totalClasses} classes, ${structure.dependencies.length} dependencies`);

      // Build dependency graph
      console.log(`[StructuralAgent] Building dependency graph...`);
      const graph = this.graphBuilder.buildGraph(structure);
      console.log(`[StructuralAgent] Graph built: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);

      // Extract insights
      const insights = this.extractInsights(structure, graph);
      console.log(`[StructuralAgent] Insights: ${insights.keyComponents.length} key components, ${insights.modules.length} modules, ${insights.criticalPaths.length} critical paths`);

      this.setState({ status: 'completed' });

      return {
        structure,
        graph,
        insights,
      };
    } catch (error) {
      this.handleError(error as Error, context);
      throw error;
    }
  }

  /**
   * Extract key insights from structure
   */
  private extractInsights(structure: ParsedCodeStructure, graph: any): {
    keyComponents: string[];
    modules: string[];
    criticalPaths: string[];
  } {
    const keyComponents: string[] = [];
    const modules: string[] = [];
    const criticalPaths: string[] = [];

    // Key components: exported functions and classes
    for (const file of structure.files) {
      for (const func of file.functions) {
        if (func.isExported) {
          keyComponents.push(`${file.path}::${func.name}`);
        }
      }
      for (const cls of file.classes) {
        if (cls.isExported) {
          keyComponents.push(`${file.path}::${cls.name}`);
        }
      }
    }

    // Modules: group files by directory
    const moduleMap = new Map<string, string[]>();
    for (const file of structure.files) {
      const dir = file.path.split('/').slice(0, -1).join('/') || '/';
      if (!moduleMap.has(dir)) {
        moduleMap.set(dir, []);
      }
      moduleMap.get(dir)!.push(file.path);
    }
    modules.push(...Array.from(moduleMap.keys()));

    // Critical paths: files with many dependencies
    const dependencyCount = new Map<string, number>();
    for (const dep of structure.dependencies) {
      dependencyCount.set(dep.to, (dependencyCount.get(dep.to) || 0) + 1);
    }
    const sorted = Array.from(dependencyCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path]) => path);
    criticalPaths.push(...sorted);

    return {
      keyComponents,
      modules,
      criticalPaths,
    };
  }
}

