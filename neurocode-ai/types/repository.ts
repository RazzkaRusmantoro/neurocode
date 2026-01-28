/**
 * Repository and code structure types
 */

export interface CodeFile {
  path: string;
  name: string;
  content: string;
  language: string;
  size: number;
  sha: string;
}

export interface ParsedCodeStructure {
  files: ParsedFile[];
  dependencies: Dependency[];
  modules: Module[];
}

export interface ParsedFile {
  path: string;
  language: string;
  functions: FunctionDefinition[];
  classes: ClassDefinition[];
  imports: ImportStatement[];
  exports: ExportStatement[];
}

export interface FunctionDefinition {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  startLine: number;
  endLine: number;
  body: string;
}

export interface ClassDefinition {
  name: string;
  methods: MethodDefinition[];
  properties: PropertyDefinition[];
  extends?: string;
  implements?: string[];
  isExported: boolean;
  startLine: number;
  endLine: number;
}

export interface MethodDefinition {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  isAsync: boolean;
  isPublic: boolean;
  isStatic: boolean;
  startLine: number;
  endLine: number;
}

export interface PropertyDefinition {
  name: string;
  type?: string;
  isPublic: boolean;
  isStatic: boolean;
}

export interface Parameter {
  name: string;
  type?: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ImportStatement {
  source: string;
  imports: string[];
  isTypeOnly: boolean;
}

export interface ExportStatement {
  name: string;
  type: 'function' | 'class' | 'variable' | 'default';
}

export interface Dependency {
  from: string; // file path
  to: string; // file path or external package
  type: 'import' | 'call' | 'extends' | 'implements';
  relationship: string; // function name, class name, etc.
}

export interface Module {
  name: string;
  files: string[];
  dependencies: string[];
  entryPoint?: string;
}

export interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'file' | 'function' | 'class' | 'module';
  name: string;
  path?: string;
  metadata?: Record<string, any>;
}

export interface GraphEdge {
  from: string; // node id
  to: string; // node id
  type: 'import' | 'call' | 'extends' | 'implements';
  weight?: number;
}

