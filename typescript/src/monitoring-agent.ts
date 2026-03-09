import * as os from 'os';
import { Metric, ErrorEvent, MonitoringData, ResolvedConfig } from './types';
import { APIClient } from './api-client';
import { Redactor } from './redactor';

/**
 * Circular buffer for storing monitoring data
 */
class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private size: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  getAll(): T[] {
    if (this.size < this.capacity) {
      return this.buffer.slice(0, this.size);
    }
    // Return items in order: from head to end, then from start to head
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  clear(): void {
    this.head = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }

  isFull(): boolean {
    return this.size >= this.capacity;
  }
}

/**
 * Monitoring agent responsible for collecting metrics and errors
 */
export class MonitoringAgent {
  private metricsBuffer: CircularBuffer<Metric>;
  private errorsBuffer: CircularBuffer<ErrorEvent>;
  private config: ResolvedConfig;
  private apiClient: APIClient;
  private redactor: Redactor;
  private monitoringInterval?: NodeJS.Timeout;
  private flushInterval?: NodeJS.Timeout;
  private lastFlushTime: number = Date.now();
  private requestCount: number = 0;
  private lastRequestCount: number = 0;
  private lastThroughputCheck: number = Date.now();
  private transmissionAttempts: number = 0;
  private transmissionSuccesses: number = 0;
  private transmissionFailures: number = 0;
  private lastTransmissionError?: string;
  private lastTransmissionSuccess?: number;

  constructor(config: ResolvedConfig, apiClient: APIClient) {
    this.config = config;
    this.apiClient = apiClient;
    this.redactor = new Redactor(
      config.security.redactionRules,
      config.security.enablePIIRedaction
    );
    this.metricsBuffer = new CircularBuffer<Metric>(config.monitoring.bufferSize);
    this.errorsBuffer = new CircularBuffer<ErrorEvent>(config.monitoring.bufferSize);
  }

  /**
   * Start monitoring system metrics
   */
  startMonitoring(): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    // Collect metrics immediately on start
    this.collectSystemMetrics();

    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.monitoring.interval);

    // Start flush interval to check for time-based flushes
    this.flushInterval = setInterval(() => {
      if (this.shouldFlush()) {
        this.transmitData().catch((error) => {
          // Log error but don't throw - monitoring should continue
          console.error('Failed to transmit data:', error instanceof Error ? error.message : 'Unknown error');
        });
      }
    }, this.config.monitoring.interval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = undefined;
    }
  }

  /**
   * Capture HTTP request metrics
   */
  captureRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): void {
    this.requestCount++;

    // Apply sampling rate
    if (Math.random() > this.config.monitoring.samplingRate) {
      return;
    }

    const timestamp = Date.now();

    // Capture response time metric
    this.metricsBuffer.push({
      name: 'http.response_time',
      value: duration,
      timestamp,
      tags: {
        endpoint,
        method,
        status: statusCode.toString(),
      },
    });

    // Capture status code metric
    this.metricsBuffer.push({
      name: 'http.status',
      value: statusCode,
      timestamp,
      tags: {
        endpoint,
        method,
      },
    });

    // Check if buffer should be flushed due to capacity
    if (this.shouldFlush()) {
      this.transmitData().catch((error) => {
        console.error('Failed to transmit data:', error instanceof Error ? error.message : 'Unknown error');
      });
    }
  }

  /**
   * Capture error with stack trace
   */
  captureError(error: Error, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      message: error.message,
      stack: error.stack || '',
      timestamp: Date.now(),
      context,
    };

    this.errorsBuffer.push(errorEvent);

    // Check if buffer should be flushed due to capacity
    if (this.shouldFlush()) {
      this.transmitData().catch((error) => {
        console.error('Failed to transmit data:', error instanceof Error ? error.message : 'Unknown error');
      });
    }
  }

  /**
   * Collect system metrics (CPU, memory, throughput)
   */
  private collectSystemMetrics(): void {
    const timestamp = Date.now();

    // Memory usage
    const memoryUsage = process.memoryUsage();
    this.metricsBuffer.push({
      name: 'system.memory.heap_used',
      value: Math.round(memoryUsage.heapUsed / 1024 / 1024), // Convert to MB
      timestamp,
    });

    this.metricsBuffer.push({
      name: 'system.memory.heap_total',
      value: Math.round(memoryUsage.heapTotal / 1024 / 1024), // Convert to MB
      timestamp,
    });

    // CPU usage (approximation using os.loadavg)
    const loadAvg = os.loadavg();
    const cpuCount = os.cpus().length;
    const cpuUsagePercent = (loadAvg[0] / cpuCount) * 100;

    this.metricsBuffer.push({
      name: 'system.cpu.usage',
      value: Math.round(cpuUsagePercent * 100) / 100, // Round to 2 decimal places
      timestamp,
    });

    // Request throughput (requests per second)
    const now = Date.now();
    const timeDiff = (now - this.lastThroughputCheck) / 1000; // Convert to seconds
    if (timeDiff > 0) {
      const throughput = (this.requestCount - this.lastRequestCount) / timeDiff;
      this.metricsBuffer.push({
        name: 'http.throughput',
        value: Math.round(throughput * 100) / 100, // Round to 2 decimal places
        timestamp,
      });

      this.lastRequestCount = this.requestCount;
      this.lastThroughputCheck = now;
    }
  }

  /**
   * Get all buffered data, filtering out data older than retention period
   */
  getBufferedData(): MonitoringData {
    const now = Date.now();
    const retentionCutoff = now - this.config.security.dataRetentionPeriod;
    
    return {
      metrics: this.metricsBuffer.getAll().filter(m => m.timestamp >= retentionCutoff),
      errors: this.errorsBuffer.getAll().filter(e => e.timestamp >= retentionCutoff),
    };
  }

  /**
   * Clear all buffered data
   */
  clearBuffer(): void {
    this.metricsBuffer.clear();
    this.errorsBuffer.clear();
    this.lastFlushTime = Date.now();
  }

  /**
   * Check if buffer should be flushed
   */
  shouldFlush(): boolean {
    const timeSinceFlush = Date.now() - this.lastFlushTime;
    const timeThreshold = this.config.monitoring.interval;

    return (
      this.metricsBuffer.isFull() ||
      this.errorsBuffer.isFull() ||
      timeSinceFlush >= timeThreshold
    );
  }

  /**
   * Transmit buffered data to backend in batches
   */
  async transmitData(): Promise<void> {
    const data = this.getBufferedData();
    
    // Only transmit if there's data
    if (data.metrics.length === 0 && data.errors.length === 0) {
      return;
    }

    // Batch size limit (up to 100 events per transmission)
    const BATCH_SIZE = 100;
    const totalEvents = data.metrics.length + data.errors.length;
    
    if (totalEvents <= BATCH_SIZE) {
      // Single batch transmission
      await this.transmitBatch(data);
    } else {
      // Multiple batch transmissions
      let metricsOffset = 0;
      let errorsOffset = 0;
      
      while (metricsOffset < data.metrics.length || errorsOffset < data.errors.length) {
        const metricsInBatch = Math.min(BATCH_SIZE, data.metrics.length - metricsOffset);
        const remainingSpace = BATCH_SIZE - metricsInBatch;
        const errorsInBatch = Math.min(remainingSpace, data.errors.length - errorsOffset);
        
        const batch: MonitoringData = {
          metrics: data.metrics.slice(metricsOffset, metricsOffset + metricsInBatch),
          errors: data.errors.slice(errorsOffset, errorsOffset + errorsInBatch),
        };
        
        await this.transmitBatch(batch);
        
        metricsOffset += metricsInBatch;
        errorsOffset += errorsInBatch;
      }
    }
    
    // Clear buffer after all batches transmitted successfully
    this.clearBuffer();
  }

  /**
   * Transmit a single batch of data
   */
  private async transmitBatch(data: MonitoringData): Promise<void> {
    this.transmissionAttempts++;
    
    try {
      // Apply redaction before transmission
      const redactedData: MonitoringData = {
        metrics: this.redactor.redactMetrics(data.metrics),
        errors: this.redactor.redactErrors(data.errors),
      };
      
      await this.apiClient.transmitMonitoringData(redactedData);
      this.transmissionSuccesses++;
      this.lastTransmissionSuccess = Date.now();
    } catch (error) {
      this.transmissionFailures++;
      this.lastTransmissionError = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Get buffer statistics
   */
  getBufferStats(): { metricsCount: number; errorsCount: number } {
    return {
      metricsCount: this.metricsBuffer.getSize(),
      errorsCount: this.errorsBuffer.getSize(),
    };
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.monitoringInterval !== undefined;
  }

  /**
   * Get transmission statistics
   */
  getTransmissionStats(): {
    attempts: number;
    successes: number;
    failures: number;
    successRate: number;
    lastError?: string;
    lastSuccess?: number;
  } {
    const successRate = this.transmissionAttempts > 0
      ? this.transmissionSuccesses / this.transmissionAttempts
      : 1.0;

    return {
      attempts: this.transmissionAttempts,
      successes: this.transmissionSuccesses,
      failures: this.transmissionFailures,
      successRate,
      lastError: this.lastTransmissionError,
      lastSuccess: this.lastTransmissionSuccess,
    };
  }
}
