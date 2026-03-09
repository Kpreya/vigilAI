/**
 * Data redaction engine for sensitive information
 */

export interface RedactionRule {
  pattern: RegExp;
  replacement: string;
}

/**
 * Default PII redaction patterns
 */
const DEFAULT_PII_PATTERNS: RedactionRule[] = [
  // Email addresses
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: '[EMAIL_REDACTED]' },
  
  // Credit card numbers (various formats)
  { pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, replacement: '[CARD_REDACTED]' },
  
  // Social Security Numbers (US)
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN_REDACTED]' },
  
  // Phone numbers (various formats)
  { pattern: /\b(\+\d{1,3}[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g, replacement: '[PHONE_REDACTED]' },
  
  // IP addresses
  { pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, replacement: '[IP_REDACTED]' },
  
  // API keys and tokens (common patterns)
  { pattern: /\b[A-Za-z0-9_-]{32,}\b/g, replacement: '[TOKEN_REDACTED]' },
  
  // Bearer tokens
  { pattern: /Bearer\s+[A-Za-z0-9_-]+/gi, replacement: 'Bearer [TOKEN_REDACTED]' },
  
  // Authorization headers
  { pattern: /Authorization:\s*[^\s]+/gi, replacement: 'Authorization: [REDACTED]' },
];

/**
 * Sensitive field names that should always be redacted
 */
const SENSITIVE_FIELD_NAMES = [
  'password',
  'passwd',
  'pwd',
  'secret',
  'token',
  'api_key',
  'apikey',
  'api-key',
  'auth',
  'authorization',
  'credential',
  'private_key',
  'privatekey',
  'access_token',
  'refresh_token',
  'session_id',
  'sessionid',
];

export class Redactor {
  private rules: RedactionRule[];
  private enablePIIRedaction: boolean;

  constructor(customRules: string[] = [], enablePIIRedaction: boolean = true) {
    this.enablePIIRedaction = enablePIIRedaction;
    
    // Compile custom rules
    const compiledCustomRules: RedactionRule[] = customRules.map(pattern => ({
      pattern: new RegExp(pattern, 'g'),
      replacement: '[REDACTED]',
    }));

    // Combine default PII patterns with custom rules
    this.rules = enablePIIRedaction 
      ? [...DEFAULT_PII_PATTERNS, ...compiledCustomRules]
      : compiledCustomRules;
  }

  /**
   * Redact sensitive information from a string
   */
  redactString(text: string): string {
    if (!text) return text;
    
    let redacted = text;
    for (const rule of this.rules) {
      redacted = redacted.replace(rule.pattern, rule.replacement);
    }
    
    return redacted;
  }

  /**
   * Redact sensitive information from an object
   */
  redactObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return this.redactString(obj);
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactObject(item));
    }

    if (typeof obj === 'object') {
      const redacted: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Check if field name is sensitive
        const lowerKey = key.toLowerCase();
        const isSensitiveField = SENSITIVE_FIELD_NAMES.some(
          sensitiveKey => lowerKey.includes(sensitiveKey)
        );

        if (isSensitiveField) {
          redacted[key] = '[REDACTED]';
        } else {
          redacted[key] = this.redactObject(value);
        }
      }
      
      return redacted;
    }

    return obj;
  }

  /**
   * Redact sensitive information from metrics
   */
  redactMetrics(metrics: any[]): any[] {
    return metrics.map(metric => this.redactObject(metric));
  }

  /**
   * Redact sensitive information from error events
   */
  redactErrors(errors: any[]): any[] {
    return errors.map(error => ({
      ...error,
      message: this.redactString(error.message),
      stack: this.redactString(error.stack),
      context: error.context ? this.redactObject(error.context) : undefined,
    }));
  }
}
