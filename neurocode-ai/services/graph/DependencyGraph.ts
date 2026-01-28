import { DependencyGraph, GraphNode, GraphEdge, ParsedCodeStructure } from '../../types/repository';

/**
 * Builds dependency graphs from parsed code structure
 */
export class DependencyGraphBuilder {
  /**
   * Build dependency graph from parsed structure
   */
  buildGraph(structure: ParsedCodeStructure): DependencyGraph {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Create nodes for files
    for (const file of structure.files) {
      nodes.push({
        id: file.path,
        type: 'file',
        name: file.path.split('/').pop() || file.path,
        path: file.path,
        metadata: {
          language: file.language,
          functionCount: file.functions.length,
          classCount: file.classes.length,
        },
      });

      // Create nodes for functions
      for (const func of file.functions) {
        const funcId = `${file.path}::${func.name}`;
        nodes.push({
          id: funcId,
          type: 'function',
          name: func.name,
          path: file.path,
          metadata: {
            isExported: func.isExported,
            isAsync: func.isAsync,
            parameterCount: func.parameters.length,
          },
        });

        // Edge from file to function
        edges.push({
          from: file.path,
          to: funcId,
          type: 'call',
        });
      }

      // Create nodes for classes
      for (const cls of file.classes) {
        const classId = `${file.path}::${cls.name}`;
        nodes.push({
          id: classId,
          type: 'class',
          name: cls.name,
          path: file.path,
          metadata: {
            isExported: cls.isExported,
            methodCount: cls.methods.length,
            extends: cls.extends,
          },
        });

        // Edge from file to class
        edges.push({
          from: file.path,
          to: classId,
          type: 'call',
        });

        // Edge for extends relationship
        if (cls.extends) {
          edges.push({
            from: classId,
            to: cls.extends,
            type: 'extends',
          });
        }
      }
    }

    // Create edges for dependencies
    for (const dep of structure.dependencies) {
      edges.push({
        from: dep.from,
        to: dep.to,
        type: dep.type as any,
        weight: 1,
      });
    }

    return { nodes, edges };
  }

  /**
   * Find related files for a given file path
   */
  findRelatedFiles(graph: DependencyGraph, filePath: string, maxDepth: number = 2): string[] {
    const related = new Set<string>();
    const visited = new Set<string>();
    
    const traverse = (currentPath: string, depth: number) => {
      if (depth > maxDepth || visited.has(currentPath)) return;
      visited.add(currentPath);

      // Find all edges connected to this file
      const connectedEdges = graph.edges.filter(
        edge => edge.from === currentPath || edge.to === currentPath
      );

      for (const edge of connectedEdges) {
        const relatedPath = edge.from === currentPath ? edge.to : edge.from;
        
        // Only include file nodes, not function/class nodes
        const relatedNode = graph.nodes.find(n => n.id === relatedPath && n.type === 'file');
        if (relatedNode && relatedPath !== filePath) {
          related.add(relatedPath);
          traverse(relatedPath, depth + 1);
        }
      }
    };

    traverse(filePath, 0);
    return Array.from(related);
  }

  /**
   * Get all files in a module (files that import each other)
   */
  getModuleFiles(graph: DependencyGraph, entryFile: string): string[] {
    const moduleFiles = new Set<string>([entryFile]);
    const visited = new Set<string>();

    const traverse = (filePath: string) => {
      if (visited.has(filePath)) return;
      visited.add(filePath);

      // Find files that this file imports
      const imports = graph.edges.filter(
        edge => edge.from === filePath && edge.type === 'import'
      );

      for (const imp of imports) {
        const importedFile = graph.nodes.find(n => n.id === imp.to && n.type === 'file');
        if (importedFile) {
          moduleFiles.add(importedFile.path || importedFile.id);
          traverse(importedFile.path || importedFile.id);
        }
      }
    };

    traverse(entryFile);
    return Array.from(moduleFiles);
  }
}

