import { ParsedCodeStructure, ParsedFile, FunctionDefinition, ClassDefinition, ImportStatement, Dependency } from '../../types/repository';

/**
 * Code parser service
 * For now, simplified parsing - can be enhanced with Tree-sitter later
 */
export class CodeParser {
  /**
   * Parse a code file and extract structure
   */
  parseFile(path: string, content: string, language: string): ParsedFile {
    const functions = this.extractFunctions(content, language);
    const classes = this.extractClasses(content, language);
    const imports = this.extractImports(content, language);

    return {
      path,
      language,
      functions,
      classes,
      imports,
      exports: [],
    };
  }

  /**
   * Parse multiple files and build structure
   */
  parseFiles(files: Array<{ path: string; content: string; language: string }>): ParsedCodeStructure {
    const parsedFiles: ParsedFile[] = [];
    const dependencies: Dependency[] = [];

    for (const file of files) {
      const parsed = this.parseFile(file.path, file.content, file.language);
      parsedFiles.push(parsed);

      // Build dependencies from imports
      for (const imp of parsed.imports) {
        dependencies.push({
          from: file.path,
          to: imp.source,
          type: 'import',
          relationship: imp.imports.join(', '),
        });
      }
    }

    return {
      files: parsedFiles,
      dependencies,
      modules: [],
    };
  }

  /**
   * Extract functions from code (simplified regex-based)
   */
  private extractFunctions(content: string, language: string): FunctionDefinition[] {
    const functions: FunctionDefinition[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Match function declarations: function name(params) { ... }
      const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
      let match;
      let lineNumber = 1;

      while ((match = functionRegex.exec(content)) !== null) {
        const name = match[1];
        const paramsStr = match[2];
        const isAsync = content.substring(0, match.index).includes('async');
        const isExported = content.substring(0, match.index).includes('export');

        // Count lines up to match
        lineNumber = (content.substring(0, match.index).match(/\n/g) || []).length + 1;

        // Extract parameters
        const parameters = this.parseParameters(paramsStr);

        functions.push({
          name,
          parameters,
          isAsync,
          isExported,
          startLine: lineNumber,
          endLine: lineNumber + 10, // Approximate
          body: '',
        });
      }

      // Match arrow functions: const name = (params) => { ... }
      const arrowFunctionRegex = /(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>/g;
      while ((match = arrowFunctionRegex.exec(content)) !== null) {
        const name = match[1];
        const paramsStr = match[2];
        const isAsync = content.substring(0, match.index).includes('async');
        const isExported = content.substring(0, match.index).includes('export');

        lineNumber = (content.substring(0, match.index).match(/\n/g) || []).length + 1;

        const parameters = this.parseParameters(paramsStr);

        functions.push({
          name,
          parameters,
          isAsync,
          isExported,
          startLine: lineNumber,
          endLine: lineNumber + 10,
          body: '',
        });
      }
    }

    return functions;
  }

  /**
   * Extract classes from code
   */
  private extractClasses(content: string, language: string): ClassDefinition[] {
    const classes: ClassDefinition[] = [];

    if (language === 'typescript' || language === 'javascript') {
      const classRegex = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?(?:\s+implements\s+([^{]+))?\s*\{/g;
      let match;

      while ((match = classRegex.exec(content)) !== null) {
        const name = match[1];
        const extendsClass = match[2];
        const implementsStr = match[3];
        const isExported = content.substring(0, match.index).includes('export');
        const lineNumber = (content.substring(0, match.index).match(/\n/g) || []).length + 1;

        classes.push({
          name,
          methods: [],
          properties: [],
          extends: extendsClass,
          implements: implementsStr ? implementsStr.split(',').map(s => s.trim()) : undefined,
          isExported,
          startLine: lineNumber,
          endLine: lineNumber + 20,
        });
      }
    }

    return classes;
  }

  /**
   * Extract import statements
   */
  private extractImports(content: string, language: string): ImportStatement[] {
    const imports: ImportStatement[] = [];

    if (language === 'typescript' || language === 'javascript') {
      // Match: import { ... } from 'source'
      const importRegex = /import\s+(?:(type\s+)?\{([^}]+)\}|(\w+)|(\*)\s+as\s+(\w+))\s+from\s+['"]([^'"]+)['"]/g;
      let match;

      while ((match = importRegex.exec(content)) !== null) {
        const isTypeOnly = !!match[1];
        const namedImports = match[2] ? match[2].split(',').map(s => s.trim()) : [];
        const defaultImport = match[3];
        const namespaceImport = match[5];
        const source = match[6] || match[7];

        const importNames: string[] = [];
        if (defaultImport) importNames.push(defaultImport);
        if (namespaceImport) importNames.push(`* as ${namespaceImport}`);
        if (namedImports.length > 0) importNames.push(...namedImports);

        imports.push({
          source,
          imports: importNames,
          isTypeOnly,
        });
      }
    }

    return imports;
  }

  /**
   * Parse function parameters
   */
  private parseParameters(paramsStr: string): Array<{ name: string; type?: string; optional: boolean; defaultValue?: string }> {
    if (!paramsStr.trim()) return [];

    return paramsStr.split(',').map(param => {
      const trimmed = param.trim();
      const optional = trimmed.includes('?');
      const hasDefault = trimmed.includes('=');
      
      let name = trimmed;
      let type: string | undefined;
      let defaultValue: string | undefined;

      if (hasDefault) {
        const [left, right] = trimmed.split('=');
        name = left.trim();
        defaultValue = right.trim();
      }

      if (name.includes(':')) {
        const [paramName, paramType] = name.split(':');
        name = paramName.trim();
        type = paramType.trim();
      }

      // Remove ? from name
      name = name.replace('?', '').trim();

      return {
        name,
        type,
        optional,
        defaultValue,
      };
    });
  }
}

