/**
 * AI Diagnostician for analyzing incidents and determining root causes using Amazon Bedrock
 */

import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { Incident } from './types';

/**
 * Diagnosis category types
 */
export type DiagnosisCategory = 
  | 'performance' 
  | 'memory_leak' 
  | 'logic_error' 
  | 'resource_exhaustion'
  | 'configuration'
  | 'dependency'
  | 'unknown';

/**
 * Code location information
 */
export interface CodeLocation {
  file: string;
  line?: number;
  function?: string;
}

/**
 * Diagnosis result from AI analysis
 */
export interface Diagnosis {
  incidentId: string;
  rootCause: string;
  explanation: string;
  codeLocation?: CodeLocation;
  category: DiagnosisCategory;
  confidence: number; // 0-1
  suggestedFix?: string;
  timestamp: number;
}

/**
 * AI Diagnostician configuration
 */
export interface AIDiagnosticianConfig {
  apiKey?: string; // Kept for backward compatibility but not used
  apiEndpoint?: string; // Kept for backward compatibility but not used
  timeout?: number; // milliseconds, default: 30000
  model?: string; // AI model to use
}

/**
 * AI Diagnostician class for root cause analysis using Amazon Bedrock
 */
export class AIDiagnostician {
  private client: BedrockRuntimeClient;
  private config: AIDiagnosticianConfig;
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  private readonly DEFAULT_MODEL = 'anthropic.claude-3-sonnet-20240229-v1:0';

  constructor(config: AIDiagnosticianConfig = {}) {
    this.config = {
      ...config,
      timeout: config.timeout || this.DEFAULT_TIMEOUT,
      model: config.model || this.DEFAULT_MODEL,
    };

    // Initialize Bedrock client with credentials from environment
    this.client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  /**
   * Diagnose an incident using Amazon Bedrock AI
   */
  async diagnose(incident: Incident): Promise<Diagnosis> {
    try {
      // Build the diagnosis prompt
      const prompt = this.buildDiagnosisPrompt(incident);

      // Call Bedrock API
      const command = new InvokeModelCommand({
        modelId: this.config.model,
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt,
          }],
          temperature: 0.3, // Lower temperature for more focused responses
        }),
      });

      const response = await this.client.send(command);
      
      // Parse the response
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const diagnosis = this.parseDiagnosisResponse(incident.id, responseBody);
      return diagnosis;

    } catch (error) {
      // Log error but don't block incident creation
      console.error('Bedrock AI diagnosis failed:', error instanceof Error ? error.message : 'Unknown error');
      return this.createGenericDiagnosis(incident);
    }
  }

  /**
   * Build diagnosis prompt from incident data for Bedrock
   */
  private buildDiagnosisPrompt(incident: Incident): string {
    const parts: string[] = [
      'You are an expert software diagnostician. Analyze the incident data and provide a structured diagnosis.',
      '',
      '# Incident Analysis Request',
      '',
      `## Incident Details`,
      `- ID: ${incident.id}`,
      `- Type: ${incident.type}`,
      `- Severity: ${incident.severity}`,
      `- Timestamp: ${new Date(incident.timestamp).toISOString()}`,
      '',
    ];

    // Add metrics information
    if (incident.metrics.length > 0) {
      parts.push('## Metrics');
      incident.metrics.slice(0, 10).forEach(metric => {
        parts.push(`- ${metric.name}: ${metric.value}${metric.tags ? ` (${JSON.stringify(metric.tags)})` : ''}`);
      });
      parts.push('');
    }

    // Add error information
    if (incident.errors.length > 0) {
      parts.push('## Errors');
      incident.errors.slice(0, 3).forEach(error => {
        parts.push(`### Error: ${error.message}`);
        parts.push('```');
        parts.push(error.stack.split('\n').slice(0, 10).join('\n'));
        parts.push('```');
        parts.push('');
      });
    }

    // Add context information
    if (incident.context && Object.keys(incident.context).length > 0) {
      parts.push('## Context');
      Object.entries(incident.context).forEach(([key, value]) => {
        parts.push(`- ${key}: ${JSON.stringify(value)}`);
      });
      parts.push('');
    }

    parts.push('## Required Output Format');
    parts.push('Provide your diagnosis in the following JSON format:');
    parts.push('```json');
    parts.push('{');
    parts.push('  "rootCause": "Brief description of the root cause",');
    parts.push('  "explanation": "Detailed explanation of what is happening",');
    parts.push('  "codeLocation": {');
    parts.push('    "file": "path/to/file.ts",');
    parts.push('    "line": 123,');
    parts.push('    "function": "functionName"');
    parts.push('  },');
    parts.push('  "category": "performance|memory_leak|logic_error|resource_exhaustion|configuration|dependency",');
    parts.push('  "confidence": 0.85,');
    parts.push('  "suggestedFix": "High-level description of how to fix the issue"');
    parts.push('}');
    parts.push('```');

    return parts.join('\n');
  }

  /**
   * Parse Bedrock AI response into Diagnosis object
   */
  private parseDiagnosisResponse(incidentId: string, response: any): Diagnosis {
    try {
      // Extract content from Bedrock response
      const content = response.content?.[0]?.text || '';
      
      // Try to extract JSON from the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                       content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        return {
          incidentId,
          rootCause: parsed.rootCause || 'Unable to determine root cause',
          explanation: parsed.explanation || 'No detailed explanation available',
          codeLocation: parsed.codeLocation,
          category: this.validateCategory(parsed.category),
          confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
          suggestedFix: parsed.suggestedFix,
          timestamp: Date.now(),
        };
      }

      // If no JSON found, try to extract information from text
      return {
        incidentId,
        rootCause: content.substring(0, 200) || 'Unable to determine root cause',
        explanation: content || 'AI response could not be parsed',
        category: 'unknown',
        confidence: 0.3,
        timestamp: Date.now(),
      };

    } catch (error) {
      console.error('Failed to parse Bedrock AI response:', error);
      return {
        incidentId,
        rootCause: 'Failed to parse AI diagnosis',
        explanation: 'The AI response could not be parsed into a structured diagnosis',
        category: 'unknown',
        confidence: 0,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Validate and normalize category
   */
  private validateCategory(category: string): DiagnosisCategory {
    const validCategories: DiagnosisCategory[] = [
      'performance',
      'memory_leak',
      'logic_error',
      'resource_exhaustion',
      'configuration',
      'dependency',
    ];

    if (validCategories.includes(category as DiagnosisCategory)) {
      return category as DiagnosisCategory;
    }

    return 'unknown';
  }

  /**
   * Create a generic diagnosis when AI fails
   */
  private createGenericDiagnosis(incident: Incident): Diagnosis {
    let rootCause = 'Unable to determine root cause';
    let category: DiagnosisCategory = 'unknown';
    let explanation = 'AI diagnosis service unavailable. Manual investigation required.';

    // Provide basic categorization based on incident type
    if (incident.type === 'performance') {
      category = 'performance';
      rootCause = 'Performance degradation detected';
      explanation = 'The application is experiencing performance issues. Check response times and resource usage.';
    } else if (incident.type === 'error') {
      category = 'logic_error';
      rootCause = 'Error rate exceeded threshold';
      explanation = 'Multiple errors detected. Review error logs and stack traces for details.';
    } else if (incident.type === 'resource') {
      category = 'resource_exhaustion';
      rootCause = 'Resource usage exceeded threshold';
      explanation = 'System resources (CPU/memory) are being exhausted. Check for memory leaks or inefficient code.';
    }

    return {
      incidentId: incident.id,
      rootCause,
      explanation,
      category,
      confidence: 0,
      timestamp: Date.now(),
    };
  }
}
