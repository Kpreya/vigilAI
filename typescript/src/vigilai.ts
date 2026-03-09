import { VigilAIConfig, ResolvedConfig, HealthStatus } from './types';
import { ConfigLoader } from './config';
import { APIClient } from './api-client';
import { MonitoringAgent } from './monitoring-agent';

/**
 * Main VigilAI SDK class
 */
export class VigilAI {
  private config: ResolvedConfig;
  private apiClient: APIClient;
  private monitoringAgent: MonitoringAgent;
  private initialized: boolean = false;

  constructor(config: VigilAIConfig) {
    // Load and validate configuration
    this.config = ConfigLoader.load(config);
    
    // Create API client
    this.apiClient = new APIClient(this.config.apiKey);
    
    // Create monitoring agent
    this.monitoringAgent = new MonitoringAgent(this.config, this.apiClient);
  }

  /**
   * Initialize the SDK and validate API key
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Validate API key with backend
    await this.apiClient.validateAPIKey();

    // Start monitoring
    this.monitoringAgent.startMonitoring();

    this.initialized = true;
  }

  /**
   * Get the resolved configuration
   */
  getConfig(): ResolvedConfig {
    return { ...this.config };
  }

  /**
   * Check if SDK is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get monitoring agent (for testing)
   */
  getMonitoringAgent(): MonitoringAgent {
    return this.monitoringAgent;
  }

  /**
   * Express.js middleware
   * Captures request/response metrics and errors without blocking request flow
   */
  expressMiddleware() {
    const self = this;
    
    return (req: any, res: any, next: any) => {
      // Record start time for response time calculation
      const startTime = Date.now();

      // Capture the original end method
      const originalEnd = res.end;
      const originalOn = res.on;

      // Track if response has been captured to avoid duplicate captures
      let captured = false;

      // Wrap res.end to capture metrics when response completes
      res.end = function (this: any, ...args: any[]) {
        if (!captured) {
          captured = true;
          const duration = Date.now() - startTime;
          const endpoint = req.route?.path || req.path || req.url || 'unknown';
          const method = req.method || 'UNKNOWN';
          const statusCode = res.statusCode || 200;

          // Capture request metrics asynchronously (non-blocking)
          setImmediate(() => {
            try {
              self.monitoringAgent.captureRequest(endpoint, method, statusCode, duration);
            } catch (error) {
              // Log error but don't throw - middleware should never crash the app
              console.error('VigilAI: Failed to capture request metrics:', error instanceof Error ? error.message : 'Unknown error');
            }
          });
        }

        // Call original end method
        return originalEnd.apply(this, args);
      };

      // Capture errors that occur during request processing
      const errorHandler = (error: Error) => {
        // Capture error asynchronously (non-blocking)
        setImmediate(() => {
          try {
            const context = {
              endpoint: req.route?.path || req.path || req.url || 'unknown',
              method: req.method || 'UNKNOWN',
              statusCode: res.statusCode,
              headers: req.headers,
              query: req.query,
              params: req.params,
            };
            self.monitoringAgent.captureError(error, context);
          } catch (captureError) {
            // Log error but don't throw
            console.error('VigilAI: Failed to capture error:', captureError instanceof Error ? captureError.message : 'Unknown error');
          }
        });
      };

      // Listen for error events on the response
      res.on = function (this: any, event: string, listener: any) {
        if (event === 'error') {
          // Wrap the error listener to capture errors
          const wrappedListener = (error: Error) => {
            errorHandler(error);
            return listener(error);
          };
          return originalOn.call(this, event, wrappedListener);
        }
        return originalOn.call(this, event, listener);
      };

      // Continue to next middleware
      // Wrap next() to catch synchronous errors
      try {
        next();
      } catch (error) {
        // Capture synchronous errors
        if (error instanceof Error) {
          errorHandler(error);
        }
        // Re-throw so Express error handling can process it
        throw error;
      }
    };
  }

  /**
   * Next.js middleware
   * Captures request/response metrics and errors for Next.js applications
   * 
   * Usage in middleware.ts:
   * ```typescript
   * import { NextResponse } from 'next/server';
   * import type { NextRequest } from 'next/server';
   * import { vigilai } from './lib/vigilai';
   * 
   * export async function middleware(request: NextRequest) {
   *   return vigilai.nextMiddleware(request, async (req) => {
   *     return NextResponse.next();
   *   });
   * }
   * ```
   */
  async nextMiddleware(
    request: any,
    handler: (req: any) => Promise<any>
  ): Promise<any> {
    const self = this;
    const startTime = Date.now();

    try {
      // Execute the handler
      const response = await handler(request);

      // Capture metrics asynchronously (non-blocking)
      setImmediate(() => {
        try {
          const duration = Date.now() - startTime;
          const url = new URL(request.url);
          const endpoint = url.pathname;
          const method = request.method || 'GET';
          const statusCode = response.status || 200;

          self.monitoringAgent.captureRequest(endpoint, method, statusCode, duration);
        } catch (error) {
          console.error('VigilAI: Failed to capture request metrics:', error instanceof Error ? error.message : 'Unknown error');
        }
      });

      return response;
    } catch (error) {
      // Capture error asynchronously (non-blocking)
      setImmediate(() => {
        try {
          const url = new URL(request.url);
          const context = {
            endpoint: url.pathname,
            method: request.method || 'GET',
            headers: Object.fromEntries(request.headers.entries()),
            url: request.url,
          };
          
          if (error instanceof Error) {
            self.monitoringAgent.captureError(error, context);
          }
        } catch (captureError) {
          console.error('VigilAI: Failed to capture error:', captureError instanceof Error ? captureError.message : 'Unknown error');
        }
      });

      // Re-throw the error so Next.js can handle it
      throw error;
    }
  }

  /**
   * Track a custom metric
   * Allows manual instrumentation for custom application metrics
   * 
   * @param name - Metric name (e.g., 'user.login.count', 'cache.hit_rate')
   * @param value - Numeric metric value
   * 
   * @example
   * ```typescript
   * vigilai.trackMetric('user.login.count', 1);
   * vigilai.trackMetric('cache.hit_rate', 0.95);
   * ```
   */
  trackMetric(name: string, value: number): void {
    if (!this.initialized) {
      console.warn('VigilAI: Cannot track metric - SDK not initialized');
      return;
    }

    // Capture metric asynchronously (non-blocking)
    setImmediate(() => {
      try {
        const timestamp = Date.now();
        this.monitoringAgent.getBufferedData(); // Access buffer through monitoring agent
        
        // Push metric directly to the monitoring agent's buffer
        const metric = {
          name,
          value,
          timestamp,
        };
        
        // Use the monitoring agent's internal buffer by capturing as a custom metric
        (this.monitoringAgent as any).metricsBuffer.push(metric);
        
        // Check if buffer should be flushed
        if (this.monitoringAgent.shouldFlush()) {
          this.monitoringAgent.transmitData().catch((error) => {
            console.error('VigilAI: Failed to transmit data:', error instanceof Error ? error.message : 'Unknown error');
          });
        }
      } catch (error) {
        console.error('VigilAI: Failed to track metric:', error instanceof Error ? error.message : 'Unknown error');
      }
    });
  }

  /**
   * Track an error
   * Allows manual instrumentation for custom error tracking
   * 
   * @param error - Error object to track
   * @param context - Optional context information about the error
   * 
   * @example
   * ```typescript
   * try {
   *   // Some operation
   * } catch (error) {
   *   vigilai.trackError(error as Error, {
   *     operation: 'database_query',
   *     userId: '12345'
   *   });
   * }
   * ```
   */
  trackError(error: Error, context?: object): void {
    if (!this.initialized) {
      console.warn('VigilAI: Cannot track error - SDK not initialized');
      return;
    }

    // Capture error asynchronously (non-blocking)
    setImmediate(() => {
      try {
        this.monitoringAgent.captureError(error, context);
      } catch (captureError) {
        console.error('VigilAI: Failed to track error:', captureError instanceof Error ? captureError.message : 'Unknown error');
      }
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    // Stop monitoring
    this.monitoringAgent.stopMonitoring();
    
    // Flush any remaining data
    try {
      await this.monitoringAgent.transmitData();
    } catch (error) {
      console.error('Failed to flush data during shutdown:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    this.initialized = false;
  }

  /**
   * Health check
   */
  healthCheck(): HealthStatus {
    const bufferStats = this.monitoringAgent.getBufferStats();
    const transmissionStats = this.monitoringAgent.getTransmissionStats();
    const isMonitoring = this.monitoringAgent.isMonitoring();

    // Determine monitoring component health
    const monitoringHealth: any = {
      status: isMonitoring ? 'up' : 'down',
      lastSuccess: transmissionStats.lastSuccess,
    };
    if (transmissionStats.lastError) {
      monitoringHealth.lastError = transmissionStats.lastError;
    }

    // Calculate buffer size (total events in buffer)
    const totalBufferSize = bufferStats.metricsCount + bufferStats.errorsCount;
    const maxBufferSize = this.config.monitoring.bufferSize * 2; // metrics + errors
    const bufferUtilization = totalBufferSize / maxBufferSize;

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (!isMonitoring || transmissionStats.successRate < 0.5) {
      overallStatus = 'unhealthy';
    } else if (transmissionStats.successRate < 0.9 || bufferUtilization > 0.8) {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      components: {
        monitoring: monitoringHealth,
        anomalyDetection: { status: 'up' }, // Not yet implemented
        aiDiagnosis: { status: 'up' }, // Not yet implemented
        codeGeneration: { status: 'up' }, // Not yet implemented
        githubIntegration: { status: 'up' }, // Not yet implemented
      },
      metrics: {
        bufferSize: totalBufferSize,
        transmissionSuccessRate: transmissionStats.successRate,
        averageOverhead: 0, // TODO: Implement overhead tracking
      },
    };
  }
}
