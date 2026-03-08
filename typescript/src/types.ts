/**
 * Configuration for the VigilAI SDK
 */
export interface VigilAIConfig {
  /** API key for VigilAI backend (required) */
  apiKey: string;

  /** GitHub integration configuration */
  github?: {
    token: string;
    owner: string;
    repo: string;
    baseBranch?: string;
    branchPrefix?: string;
    labels?: string[];
    assignees?: string[];
  };

  /** Monitoring configuration */
  monitoring?: {
    interval?: number;      // milliseconds, default: 60000
    samplingRate?: number;  // 0-1, default: 1.0
    bufferSize?: number;    // default: 1000
  };

  /** Threshold configuration */
  thresholds?: {
    responseTime?: number;  // ms, default: 1000
    errorRate?: number;     // percentage, default: 5
    memoryUsage?: number;   // MB, default: 500
    cpuUsage?: number;      // percentage, default: 80
  };

  /** Anomaly detection configuration */
  anomalyDetection?: {
    sensitivity?: number;         // default: 2.0
    deduplicationWindow?: number; // ms, default: 300000
  };

  /** Security configuration */
  security?: {
    redactionRules?: string[];    // regex patterns
    enablePIIRedaction?: boolean; // default: true
    dataRetentionPeriod?: number; // ms, default: 7 days
  };
}

/**
 * Internal configuration with all defaults applied
 */
export interface ResolvedConfig {
  apiKey: string;
  github?: {
    token: string;
    owner: string;
    repo: string;
    baseBranch: string;
    branchPrefix: string;
    labels: string[];
    assignees: string[];
  };
  monitoring: {
    interval: number;
    samplingRate: number;
    bufferSize: number;
  };
  thresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  anomalyDetection: {
    sensitivity: number;
    deduplicationWindow: number;
  };
  security: {
    redactionRules: string[];
    enablePIIRedaction: boolean;
    dataRetentionPeriod: number;
  };
}

/**
 * Health status for SDK components
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    monitoring: ComponentHealth;
    anomalyDetection: ComponentHealth;
    aiDiagnosis: ComponentHealth;
    codeGeneration: ComponentHealth;
    githubIntegration: ComponentHealth;
  };
  metrics: {
    bufferSize: number;
    transmissionSuccessRate: number;
    averageOverhead: number;
  };
}

export interface ComponentHealth {
  status: 'up' | 'down' | 'degraded';
  lastError?: string;
  lastSuccess?: number;
}

/**
 * Metric data structure
 */
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

/**
 * Error event data structure
 */
export interface ErrorEvent {
  message: string;
  stack: string;
  timestamp: number;
  context?: Record<string, any>;
}

/**
 * Monitoring data containing metrics and errors
 */
export interface MonitoringData {
  metrics: Metric[];
  errors: ErrorEvent[];
}

/**
 * Incident type classification
 */
export type IncidentType = 'performance' | 'error' | 'resource';

/**
 * Incident severity level
 */
export type Severity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Incident status
 */
export type IncidentStatus = 'detected' | 'diagnosed' | 'fix_generated' | 'pr_created';

/**
 * Incident data structure
 */
export interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  timestamp: number;
  metrics: Metric[];
  errors: ErrorEvent[];
  context: {
    endpoint?: string;
    affectedUsers?: number;
    duration?: number;
    [key: string]: any;
  };
  status: IncidentStatus;
}

/**
 * Baseline data for anomaly detection
 */
export interface Baseline {
  metric: string;
  mean: number;
  stdDev: number;
  threshold: number;
}
