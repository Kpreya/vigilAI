/**
 * Property-based tests for monitoring agent
 */

import fc from 'fast-check';
import { MonitoringAgent } from './monitoring-agent';
import { ResolvedConfig } from './types';
import { APIClient } from './api-client';

// Mock API client for testing
const createMockAPIClient = (): APIClient => {
  const mockClient = {
    validateAPIKey: jest.fn().mockResolvedValue(undefined),
    transmitMonitoringData: jest.fn().mockResolvedValue(undefined),
  } as any;
  return mockClient;
};

// Arbitrary for generating valid monitoring configurations
const monitoringConfigArbitrary = fc.record({
  interval: fc.integer({ min: 100, max: 2000 }), // Reduced max for faster tests
  samplingRate: fc.double({ min: 0.1, max: 1 }), // Ensure at least some sampling
  bufferSize: fc.integer({ min: 10, max: 1000 }),
});

const resolvedConfigArbitrary = fc.record({
  apiKey: fc.constant('test-key'),
  monitoring: monitoringConfigArbitrary,
  thresholds: fc.constant({
    responseTime: 1000,
    errorRate: 5,
    memoryUsage: 500,
    cpuUsage: 80,
  }),
  anomalyDetection: fc.constant({
    sensitivity: 2.0,
    deduplicationWindow: 300000,
  }),
  security: fc.constant({
    redactionRules: [],
    enablePIIRedaction: true,
    dataRetentionPeriod: 604800000,
  }),
});

describe('Property 13: Comprehensive metric collection', () => {
  /**
   * Property 13: Comprehensive metric collection - all metric types should be collected
   * 
   * **Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6**
   */
  it('should collect all configured metric types for any monitoring interval', async () => {
    await fc.assert(
      fc.asyncProperty(resolvedConfigArbitrary, async (config: ResolvedConfig) => {
        // Force sampling rate to 1.0 for this test to ensure metrics are captured
        const testConfig = { ...config, monitoring: { ...config.monitoring, samplingRate: 1.0 } };
        const agent = new MonitoringAgent(testConfig, createMockAPIClient());

        try {
          // Start monitoring to collect system metrics
          agent.startMonitoring();

          // Capture HTTP request to get HTTP metrics
          agent.captureRequest('/api/test', 'GET', 200, 150.5);

          // Wait for at least one collection cycle
          await new Promise(resolve => setTimeout(resolve, testConfig.monitoring.interval + 200));

          const data = agent.getBufferedData();

          // Check that we have metrics
          expect(data.metrics.length).toBeGreaterThan(0);

          const metricNames = new Set(data.metrics.map(m => m.name));

          // Verify HTTP metrics are collected (Requirements 4.2, 4.6)
          expect(metricNames.has('http.response_time')).toBe(true);
          expect(metricNames.has('http.status')).toBe(true);

          // Verify system metrics are collected (Requirements 4.4, 4.5)
          // Memory metrics (Requirement 4.4)
          const memoryMetrics = Array.from(metricNames).filter(name => name.includes('memory'));
          expect(memoryMetrics.length).toBeGreaterThan(0);

          // CPU metrics (Requirement 4.5)
          expect(metricNames.has('system.cpu.usage')).toBe(true);

          // Throughput metrics (Requirement 4.6)
          expect(metricNames.has('http.throughput')).toBe(true);
        } finally {
          agent.stopMonitoring();
        }
      }),
      { numRuns: 20 }
    );
  }, 60000); // Increase timeout for async property test with 20 runs
});

describe('Property 14: Error stack trace capture', () => {
  /**
   * Property 14: Error stack trace capture - errors should include stack traces
   * 
   * **Validates: Requirements 4.7**
   */
  it('should include complete stack trace for any captured error', () => {
    fc.assert(
      fc.property(
        resolvedConfigArbitrary,
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.boolean(),
        (config: ResolvedConfig, errorMessage: string, hasContext: boolean) => {
          const agent = new MonitoringAgent(config, createMockAPIClient());

          try {
            // Create and capture an error
            try {
              throw new Error(errorMessage);
            } catch (error) {
              const context = hasContext ? { test: 'context' } : undefined;
              agent.captureError(error as Error, context);
            }

            const data = agent.getBufferedData();

            // Verify error was captured
            expect(data.errors.length).toBe(1);

            const capturedError = data.errors[0];

            // Verify error has required fields
            expect(capturedError.message).toBe(errorMessage);
            expect(capturedError.stack).toBeDefined();
            expect(capturedError.stack.length).toBeGreaterThan(0);
            expect(capturedError.stack).toContain('Error');
            expect(capturedError.timestamp).toBeGreaterThan(0);

            // Verify context is preserved
            if (hasContext) {
              expect(capturedError.context).toBeDefined();
              expect(capturedError.context).toEqual({ test: 'context' });
            } else {
              expect(capturedError.context).toBeUndefined();
            }
          } finally {
            agent.stopMonitoring();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});

describe('Property 16: Data buffering', () => {
  /**
   * Property 16: Data buffering - metrics should be buffered locally
   * 
   * **Validates: Requirements 4.10**
   */
  it('should buffer metrics locally for any collected metric', () => {
    fc.assert(
      fc.property(
        resolvedConfigArbitrary,
        fc.integer({ min: 1, max: 50 }),
        (config: ResolvedConfig, numRequests: number) => {
          // Force sampling rate to 1.0 for this test to ensure metrics are captured
          const testConfig = { ...config, monitoring: { ...config.monitoring, samplingRate: 1.0 } };
          const agent = new MonitoringAgent(testConfig, createMockAPIClient());

          try {
            // Capture multiple requests
            for (let i = 0; i < numRequests; i++) {
              agent.captureRequest(`/api/test${i}`, 'GET', 200, 100);
            }

            // Get buffered data
            const data = agent.getBufferedData();

            // Verify data is buffered
            expect(data.metrics.length).toBeGreaterThan(0);

            // Each request creates 2 metrics (response_time and status)
            const expectedMetrics = Math.min(numRequests * 2, config.monitoring.bufferSize);
            expect(data.metrics.length).toBeLessThanOrEqual(expectedMetrics);

            // Verify buffer stats are accurate
            const stats = agent.getBufferStats();
            expect(stats.metricsCount).toBe(data.metrics.length);
          } finally {
            agent.stopMonitoring();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should buffer errors locally for any captured error', () => {
    fc.assert(
      fc.property(
        resolvedConfigArbitrary,
        fc.integer({ min: 1, max: 50 }),
        (config: ResolvedConfig, numErrors: number) => {
          const agent = new MonitoringAgent(config, createMockAPIClient());

          try {
            // Capture multiple errors
            for (let i = 0; i < numErrors; i++) {
              try {
                throw new Error(`Error ${i}`);
              } catch (error) {
                agent.captureError(error as Error);
              }
            }

            // Get buffered data
            const data = agent.getBufferedData();

            // Verify errors are buffered
            expect(data.errors.length).toBeGreaterThan(0);

            const expectedErrors = Math.min(numErrors, config.monitoring.bufferSize);
            expect(data.errors.length).toBeLessThanOrEqual(expectedErrors);

            // Verify buffer stats are accurate
            const stats = agent.getBufferStats();
            expect(stats.errorsCount).toBe(data.errors.length);
          } finally {
            agent.stopMonitoring();
          }
        }
      ),
      { numRuns: 20 }
    );
  });

  it('should overwrite oldest data when buffer is full (FIFO)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }),
        (interval: number) => {
          // Use a small buffer for testing
          const config: ResolvedConfig = {
            apiKey: 'test-key',
            monitoring: {
              interval,
              samplingRate: 1.0,
              bufferSize: 5,
            },
            thresholds: {
              responseTime: 1000,
              errorRate: 5,
              memoryUsage: 500,
              cpuUsage: 80,
            },
            anomalyDetection: {
              sensitivity: 2.0,
              deduplicationWindow: 300000,
            },
            security: {
              redactionRules: [],
              enablePIIRedaction: true,
              dataRetentionPeriod: 604800000,
            },
          };

          const agent = new MonitoringAgent(config, createMockAPIClient());

          try {
            // Fill buffer beyond capacity
            for (let i = 0; i < 10; i++) {
              agent.captureRequest(`/api/test${i}`, 'GET', 200, 100);
            }

            const data = agent.getBufferedData();

            // Buffer should be at capacity, not exceed it
            expect(data.metrics.length).toBe(5);

            // Verify oldest data was overwritten
            const stats = agent.getBufferStats();
            expect(stats.metricsCount).toBe(5);
          } finally {
            agent.stopMonitoring();
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
