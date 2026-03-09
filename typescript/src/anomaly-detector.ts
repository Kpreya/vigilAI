/**
 * Anomaly Detector
 * 
 * Analyzes metrics against baselines, detects statistical outliers,
 * creates incidents for anomalies, and deduplicates similar incidents.
 */

import { 
  MonitoringData, 
  Incident, 
  Baseline, 
  Metric, 
  IncidentType, 
  Severity,
  ResolvedConfig 
} from './types';

export class AnomalyDetector {
  private baselines: Map<string, Baseline> = new Map();
  private recentIncidents: Incident[] = [];
  private config: ResolvedConfig;

  constructor(config: ResolvedConfig) {
    this.config = config;
  }

  /**
   * Analyze metrics for anomalies and create incidents
   */
  analyzeMetrics(data: MonitoringData): Incident[] {
    const incidents: Incident[] = [];

    // Check threshold violations for all metric types
    for (const metric of data.metrics) {
      const incident = this.checkThresholdViolation(metric, data);
      if (incident) {
        incidents.push(incident);
      }
    }

    // Check for statistical outliers using Z-score
    for (const metric of data.metrics) {
      const incident = this.checkStatisticalOutlier(metric, data);
      if (incident) {
        incidents.push(incident);
      }
    }

    // Deduplicate incidents
    const deduplicated = this.deduplicateIncidents(incidents);

    // Store recent incidents for deduplication
    this.recentIncidents.push(...deduplicated);
    this.cleanupOldIncidents();

    return deduplicated;
  }

  /**
   * Update baselines using historical data
   */
  updateBaselines(data: MonitoringData): void {
    const metricGroups = this.groupMetricsByName(data.metrics);

    for (const [metricName, metrics] of metricGroups.entries()) {
      if (metrics.length === 0) continue;

      const values = metrics.map(m => m.value);
      const mean = this.calculateMean(values);
      const stdDev = this.calculateStdDev(values, mean);
      const threshold = mean + (this.config.anomalyDetection.sensitivity * stdDev);

      this.baselines.set(metricName, {
        metric: metricName,
        mean,
        stdDev,
        threshold
      });
    }
  }

  /**
   * Deduplicate similar incidents within time window
   */
  deduplicateIncidents(incidents: Incident[]): Incident[] {
    const deduplicated: Incident[] = [];

    for (const incident of incidents) {
      const isDuplicate = this.recentIncidents.some(recent => 
        this.areSimilarIncidents(incident, recent)
      );

      if (!isDuplicate) {
        deduplicated.push(incident);
      }
    }

    return deduplicated;
  }

  /**
   * Check if metric violates configured threshold
   */
  private checkThresholdViolation(metric: Metric, data: MonitoringData): Incident | null {
    const { thresholds } = this.config;
    let violated = false;
    let type: IncidentType = 'performance';
    let severity: Severity = 'medium';

    // Check response time threshold
    if (metric.name === 'http.response_time' && metric.value > thresholds.responseTime) {
      violated = true;
      type = 'performance';
      severity = this.calculateSeverity(metric.value, thresholds.responseTime);
    }

    // Check error rate threshold
    if (metric.name === 'http.error_rate' && metric.value > thresholds.errorRate) {
      violated = true;
      type = 'error';
      severity = this.calculateSeverity(metric.value, thresholds.errorRate);
    }

    // Check memory usage threshold
    if (metric.name === 'system.memory_usage' && metric.value > thresholds.memoryUsage) {
      violated = true;
      type = 'resource';
      severity = this.calculateSeverity(metric.value, thresholds.memoryUsage);
    }

    // Check CPU usage threshold
    if (metric.name === 'system.cpu_usage' && metric.value > thresholds.cpuUsage) {
      violated = true;
      type = 'resource';
      severity = this.calculateSeverity(metric.value, thresholds.cpuUsage);
    }

    if (!violated) return null;

    return this.createIncident(type, severity, [metric], data.errors, {
      endpoint: metric.tags?.endpoint,
      detectionMethod: 'threshold'
    });
  }

  /**
   * Check if metric is a statistical outlier using Z-score
   */
  private checkStatisticalOutlier(metric: Metric, data: MonitoringData): Incident | null {
    const baseline = this.baselines.get(metric.name);
    if (!baseline) return null;

    // Calculate Z-score
    const zScore = baseline.stdDev === 0 
      ? 0 
      : (metric.value - baseline.mean) / baseline.stdDev;

    // Check if Z-score exceeds sensitivity threshold
    if (Math.abs(zScore) < this.config.anomalyDetection.sensitivity) {
      return null;
    }

    // Determine incident type based on metric name
    let type: IncidentType = 'performance';
    if (metric.name.includes('error')) {
      type = 'error';
    } else if (metric.name.includes('memory') || metric.name.includes('cpu')) {
      type = 'resource';
    }

    const severity = this.calculateSeverityFromZScore(zScore);

    return this.createIncident(type, severity, [metric], data.errors, {
      endpoint: metric.tags?.endpoint,
      detectionMethod: 'z-score',
      zScore: zScore.toFixed(2)
    });
  }

  /**
   * Create an incident with context
   */
  private createIncident(
    type: IncidentType,
    severity: Severity,
    metrics: Metric[],
    errors: any[],
    additionalContext: Record<string, any>
  ): Incident {
    const timestamp = Date.now();
    const id = `inc-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      type,
      severity,
      timestamp,
      metrics,
      errors,
      context: {
        ...additionalContext,
        duration: 0
      },
      status: 'detected'
    };
  }

  /**
   * Calculate severity based on how much threshold is exceeded
   */
  private calculateSeverity(value: number, threshold: number): Severity {
    const ratio = value / threshold;

    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  /**
   * Calculate severity from Z-score
   */
  private calculateSeverityFromZScore(zScore: number): Severity {
    const absZScore = Math.abs(zScore);

    if (absZScore >= 4) return 'critical';
    if (absZScore >= 3) return 'high';
    if (absZScore >= 2.5) return 'medium';
    return 'low';
  }

  /**
   * Check if two incidents are similar (for deduplication)
   */
  private areSimilarIncidents(incident1: Incident, incident2: Incident): boolean {
    // Check if within deduplication window
    const timeDiff = Math.abs(incident1.timestamp - incident2.timestamp);
    if (timeDiff > this.config.anomalyDetection.deduplicationWindow) {
      return false;
    }

    // Check if same type
    if (incident1.type !== incident2.type) {
      return false;
    }

    // Check if same affected metric
    const metric1Names = incident1.metrics.map(m => m.name);
    const metric2Names = incident2.metrics.map(m => m.name);
    const hasCommonMetric = metric1Names.some(name => metric2Names.includes(name));

    if (!hasCommonMetric) {
      return false;
    }

    // Check if similar values (within 20%)
    for (const m1 of incident1.metrics) {
      const m2 = incident2.metrics.find(m => m.name === m1.name);
      if (m2) {
        const diff = Math.abs(m1.value - m2.value);
        const avg = (m1.value + m2.value) / 2;
        if (diff / avg > 0.2) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Group metrics by name
   */
  private groupMetricsByName(metrics: Metric[]): Map<string, Metric[]> {
    const groups = new Map<string, Metric[]>();

    for (const metric of metrics) {
      const existing = groups.get(metric.name) || [];
      existing.push(metric);
      groups.set(metric.name, existing);
    }

    return groups;
  }

  /**
   * Calculate mean of values
   */
  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Clean up old incidents outside deduplication window
   */
  private cleanupOldIncidents(): void {
    const cutoff = Date.now() - this.config.anomalyDetection.deduplicationWindow;
    this.recentIncidents = this.recentIncidents.filter(
      incident => incident.timestamp > cutoff
    );
  }
}
