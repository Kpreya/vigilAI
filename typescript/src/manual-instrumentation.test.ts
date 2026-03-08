/**
 * Unit tests for manual instrumentation API
 * Tests trackMetric() and trackError() methods
 */

import { VigilAI } from './vigilai';
import { VigilAIConfig } from './types';

describe('Manual Instrumentation API', () => {
  let vigilai: VigilAI;
  let mockConfig: VigilAIConfig;

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key-12345',
    };
    vigilai = new VigilAI(mockConfig);
    
    // Mock API client methods to avoid network calls
    const apiClient = (vigilai as any).apiClient;
    apiClient.validateAPIKey = jest.fn().mockResolvedValue(true);
    apiClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    if (vigilai.isInitialized()) {
      // Stop monitoring without transmitting
      const monitoringAgent = vigilai.getMonitoringAgent();
      monitoringAgent.stopMonitoring();
    }
  });

  describe('trackMetric()', () => {
    it('should track a custom metric when SDK is initialized', async () => {
      await vigilai.initialize();

      // Track a custom metric
      vigilai.trackMetric('user.login.count', 1);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify metric was added to buffer
      const monitoringAgent = vigilai.getMonitoringAgent();
      const stats = monitoringAgent.getBufferStats();
      
      expect(stats.metricsCount).toBeGreaterThan(0);
    });

    it('should not throw when SDK is not initialized', () => {
      expect(() => {
        vigilai.trackMetric('test.metric', 100);
      }).not.toThrow();
    });

    it('should track multiple metrics', async () => {
      await vigilai.initialize();

      // Track multiple metrics
      vigilai.trackMetric('cache.hit_rate', 0.95);
      vigilai.trackMetric('queue.size', 42);
      vigilai.trackMetric('response.time', 123.45);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      const monitoringAgent = vigilai.getMonitoringAgent();
      const stats = monitoringAgent.getBufferStats();
      
      expect(stats.metricsCount).toBeGreaterThan(0);
    });
  });

  describe('trackError()', () => {
    it('should track an error when SDK is initialized', async () => {
      await vigilai.initialize();

      // Track an error
      const testError = new Error('Test error');
      vigilai.trackError(testError);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify error was added to buffer
      const monitoringAgent = vigilai.getMonitoringAgent();
      const stats = monitoringAgent.getBufferStats();
      
      expect(stats.errorsCount).toBeGreaterThan(0);
    });

    it('should track error with context', async () => {
      await vigilai.initialize();

      // Track error with context
      const testError = new Error('Database connection failed');
      const context = {
        operation: 'database_query',
        userId: '12345',
        query: 'SELECT * FROM users',
      };
      
      vigilai.trackError(testError, context);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 50));

      const monitoringAgent = vigilai.getMonitoringAgent();
      const stats = monitoringAgent.getBufferStats();
      
      expect(stats.errorsCount).toBeGreaterThan(0);
    });

    it('should not throw when SDK is not initialized', () => {
      const testError = new Error('Test error');
      
      expect(() => {
        vigilai.trackError(testError);
      }).not.toThrow();
    });
  });

  describe('Integration', () => {
    it('should handle both metrics and errors together', async () => {
      await vigilai.initialize();

      // Track metrics and errors
      vigilai.trackMetric('operation.count', 10);
      vigilai.trackError(new Error('Operation failed'), { operation: 'test' });
      vigilai.trackMetric('operation.duration', 250);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 50));

      const monitoringAgent = vigilai.getMonitoringAgent();
      const stats = monitoringAgent.getBufferStats();
      
      expect(stats.metricsCount).toBeGreaterThan(0);
      expect(stats.errorsCount).toBeGreaterThan(0);
    });
  });
});
