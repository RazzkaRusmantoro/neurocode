import Anthropic from '@anthropic-ai/sdk';

/**
 * Service for interacting with Claude API
 */
export class ClaudeService {
  private client: Anthropic;
  // Using Claude 3.5 Sonnet instead of 4.5 for better cost efficiency
  // 3.5 Sonnet is ~70% cheaper while still providing excellent quality
  private model: string = 'claude-3-5-sonnet-20241022';

  constructor() {
    const apiKey = typeof process !== 'undefined' ? process.env.ANTHROPIC_API_KEY : undefined;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Generate documentation using Claude
   */
  async generateDocumentation(
    structure: any,
    context: any[],
    scope: 'file' | 'module' | 'repository',
    target?: string
  ): Promise<string> {
    console.log(`[ClaudeService] Building prompt for ${scope} scope...`);
    const prompt = this.buildPrompt(structure, context, scope, target);
    console.log(`[ClaudeService] Prompt length: ${prompt.length} characters`);
    console.log(`[ClaudeService] Calling Claude API with model: ${this.model}`);

    try {
      const apiStartTime = Date.now();
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const apiTime = Date.now() - apiStartTime;
      console.log(`[ClaudeService] ✓ Claude API responded in ${apiTime}ms`);

      const content = response.content[0];
      if (content.type === 'text') {
        console.log(`[ClaudeService] Response: ${content.text.length} characters, ${response.usage?.input_tokens || 'unknown'} input tokens, ${response.usage?.output_tokens || 'unknown'} output tokens`);
        return content.text;
      }

      throw new Error('Unexpected response type from Claude');
    } catch (error) {
      console.error('[ClaudeService] ✗ Claude API error:', error);
      throw error;
    }
  }

  /**
   * Build prompt for documentation generation
   */
  private buildPrompt(
    structure: any,
    context: any[],
    scope: 'file' | 'module' | 'repository',
    target?: string
  ): string {
    let prompt = `You are an expert technical writer specializing in code documentation. Generate comprehensive, clear, and accurate documentation for the following code.\n\n`;

    if (scope === 'repository') {
      prompt += `# Repository Documentation Request\n\n`;
      prompt += `Generate documentation for the entire repository.\n\n`;
    } else if (scope === 'module') {
      prompt += `# Module Documentation Request\n\n`;
      prompt += `Generate documentation for the module: ${target}\n\n`;
    } else {
      prompt += `# File Documentation Request\n\n`;
      prompt += `Generate documentation for the file: ${target}\n\n`;
    }

    prompt += `## Code Structure\n\n`;
    prompt += this.formatStructure(structure);

    if (context && context.length > 0) {
      prompt += `\n## Related Code Context\n\n`;
      context.forEach((ctx, index) => {
        prompt += `### Context ${index + 1}\n`;
        prompt += `File: ${ctx.path}\n`;
        prompt += `\`\`\`${ctx.language}\n${ctx.content}\n\`\`\`\n\n`;
      });
    }

    prompt += `\n## Documentation Requirements\n\n`;
    prompt += `Generate comprehensive documentation that includes:\n`;
    prompt += `1. **Overview**: High-level description of what this code does\n`;
    prompt += `2. **Architecture**: Structure and organization\n`;
    prompt += `3. **API Documentation**: All public functions, classes, and methods with:\n`;
    prompt += `   - Parameter descriptions\n`;
    prompt += `   - Return value descriptions\n`;
    prompt += `   - Usage examples\n`;
    prompt += `4. **Dependencies**: Key dependencies and how they're used\n`;
    prompt += `5. **Usage Examples**: Practical code examples\n`;
    prompt += `6. **Notes**: Any important considerations or best practices\n\n`;
    prompt += `Format the documentation in Markdown. Be thorough, accurate, and clear.\n`;

    return prompt;
  }

  /**
   * Format code structure for prompt
   */
  private formatStructure(structure: any): string {
    let formatted = '';

    if (structure.files && structure.files.length > 0) {
      formatted += `### Files Analyzed\n`;
      structure.files.forEach((file: any) => {
        formatted += `- ${file.path} (${file.language})\n`;
      });
      formatted += `\n`;
    }

    if (structure.functions && structure.functions.length > 0) {
      formatted += `### Functions\n`;
      structure.functions.forEach((func: any) => {
        formatted += `- ${func.name}(${func.parameters?.map((p: any) => p.name).join(', ') || ''})\n`;
      });
      formatted += `\n`;
    }

    if (structure.classes && structure.classes.length > 0) {
      formatted += `### Classes\n`;
      structure.classes.forEach((cls: any) => {
        formatted += `- ${cls.name}${cls.extends ? ` extends ${cls.extends}` : ''}\n`;
      });
      formatted += `\n`;
    }

    if (structure.dependencies && structure.dependencies.length > 0) {
      formatted += `### Dependencies\n`;
      structure.dependencies.forEach((dep: any) => {
        formatted += `- ${dep.from} → ${dep.to} (${dep.type})\n`;
      });
      formatted += `\n`;
    }

    return formatted;
  }
}

