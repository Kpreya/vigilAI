/**
 * Verification tests for non-blocking operations (Task 10.3)
 * 
 * These tests verify that:
 * - All monitoring operations are asynchronous
 * - SDK doesn't block host application request/response cycle
 */

import { VigilAI } from './vigilai';
import { VigilAIConfig } from './types';

describe('Non-blocking operations verification', () => {
  let vigilai: VigilAI;

  beforeEach(async () => {
    const config: VigilAIConfig = {
      apiKey: 'test-api-key',
      monitoring: {
        interval: 60000,
        samplingRate: 1.0,
        bufferSize: 1000,
      },
    };

    vigilai = new VigilAI(config);
    
    // Mock the API client to avoid actual network calls
    const apiClient = (vigilai as any).apiClient;
    apiClient.validateAPIKey = jest.fn().mockResolvedValue(undefined);
    apiClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);

    await vigilai.initialize();
  });

  afterEach(async () => {
    await vigilai.shutdown();
  });

  test('trackMetric should not block execution', () => {
    const startTime = Date.now();
    
    // Track multiple metrics
    for (let i = 0; i < 100; i++) {
      vigilai.trackMetric('test.metric', i);
    }
    
    const duration = Date.now() - startTime;
    
    // Should complete almost instantly (< 10ms) since operations are deferred
    expect(duration).toBeLessThan(10);
  });

  test('trackError should not block execution', () => {
    const startTime = Date.now();
    
    // Track multiple errors
    for (let i = 0; i < 100; i++) {
      vigilai.trackError(new Error(`Test error ${i}`));
    }
    
    const duration = Date.now() - startTime;
    
    // Should complete almost instantly (< 10ms) since operations are deferred
    expect(duration).toBeLessThan(10);
  });

  test('middleware should not block request processing', async () => {
    const middleware = vigilai.expressMiddleware();
    
    const mockReq = {
      method: 'GET',
      path: '/test',
      url: '/test',
      headers: {},
      query: {},
      params: {},
    };
    
    const mockRes = {
      statusCode: 200,
      end: jest.fn(function(this: any, ...args: any[]) {
        return this;
      }),
      on: jest.fn(function(this: any, event: string, listener: any) {
        return this;
      }),
    };
    
    let nextCalled = false;
    const mockNext = jest.fn(() => {
      nextCalled = true;
    });
    
    const startTime = Date.now();
    
    // Execute middleware
    middleware(mockReq, mockRes, mockNext);
    
    const duration = Date.now() - startTime;
    
    // Middleware should call next() immediately without blocking
    expect(nextCalled).toBe(true);
    expect(duration).toBeLessThan(5);
  });

  test('monitoring operations should not throw errors to host application', () => {
    // Force an error in the monitoring agent by accessing internal buffer
    const monitoringAgent = vigilai.getMonitoringAgent();
    
    // Mock transmitData to throw an error
    jest.spyOn(monitoringAgent, 'transmitData').mockRejectedValue(new Error('Network error'));
    
    // These operations should not throw even if internal operations fail
    expect(() => {
      vigilai.trackMetric('test.metric', 123);
      vigilai.trackError(new Error('Test error'));
    }).not.toThrow();
  });

  test('health check should execute synchronously and quickly', () => {
    const startTime = Date.now();
    
    const health = vigilai.healthCheck();
    
    const duration = Date.now() - startTime;
    
    // Health check should be synchronous and fast
    expect(health).toBeDefined();
    expect(health.status).toBeDefined();
    expect(duration).toBeLessThan(5);
  });
});
