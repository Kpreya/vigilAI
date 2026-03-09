import { MonitoringAgent } from './monitoring-agent';
import { ResolvedConfig } from './types';
import { APIClient } from './api-client';

// Mock APIClient
jest.mock('./api-client');

describe('MonitoringAgent', () => {
  let agent: MonitoringAgent;
  let config: ResolvedConfig;
  let mockApiClient: jest.Mocked<APIClient>;

  beforeEach(() => {
    config = {
      apiKey: 'test-key',
      monitoring: {
        interval: 1000,
        samplingRate: 1.0,
        bufferSize: 100,
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
    
    // Create mock API client
    mockApiClient = new APIClient('test-key') as jest.Mocked<APIClient>;
    mockApiClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);
    
    agent = new MonitoringAgent(config, mockApiClient);
  });

  afterEach(() => {
    agent.stopMonitoring();
  });

  describe('HTTP Request Metrics', () => {
    it('should capture HTTP request metrics', () => {
      agent.captureRequest('/api/users', 'GET', 200, 150);

      const data = agent.getBufferedData();
      expect(data.metrics.length).toBeGreaterThanOrEqual(2);

      const responseTimeMetric = data.metrics.find(m => m.name === 'http.response_time');
      expect(responseTimeMetric).toBeDefined();
      expect(responseTimeMetric?.value).toBe(150);
      expect(responseTimeMetric?.tags?.endpoint).toBe('/api/users');
      expect(responseTimeMetric?.tags?.method).toBe('GET');
      expect(responseTimeMetric?.tags?.status).toBe('200');

      const statusMetric = data.metrics.find(m => m.name === 'http.status');
      expect(statusMetric).toBeDefined();
      expect(statusMetric?.value).toBe(200);
    });

    it('should apply sampling rate', () => {
      const samplingConfig = { ...config };
      samplingConfig.monitoring.samplingRate = 0;
      const mockSamplingClient = new APIClient('test-key') as jest.Mocked<APIClient>;
      mockSamplingClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);
      const samplingAgent = new MonitoringAgent(samplingConfig, mockSamplingClient);

      samplingAgent.captureRequest('/api/test', 'GET', 200, 100);

      const data = samplingAgent.getBufferedData();
      expect(data.metrics.length).toBe(0);
    });
  });

  describe('Error Capture', () => {
    it('should capture errors with stack traces', () => {
      const error = new Error('Test error');
      const context = { userId: '123', action: 'login' };

      agent.captureError(error, context);

      const data = agent.getBufferedData();
      expect(data.errors.length).toBe(1);
      expect(data.errors[0].message).toBe('Test error');
      expect(data.errors[0].stack).toBeDefined();
      expect(data.errors[0].stack.length).toBeGreaterThan(0);
      expect(data.errors[0].context).toEqual(context);
      expect(data.errors[0].timestamp).toBeDefined();
    });

    it('should capture errors without context', () => {
      const error = new Error('Another error');

      agent.captureError(error);

      const data = agent.getBufferedData();
      expect(data.errors.length).toBe(1);
      expect(data.errors[0].message).toBe('Another error');
      expect(data.errors[0].context).toBeUndefined();
    });
  });

  describe('System Metrics', () => {
    it('should collect system metrics when monitoring starts', (done) => {
      agent.startMonitoring();

      // Metrics should be collected immediately on start
      // Use setImmediate to allow the synchronous collection to complete
      setImmediate(() => {
        const data = agent.getBufferedData();
        
        // Should have memory and CPU metrics
        const memoryMetrics = data.metrics.filter(m => m.name.startsWith('system.memory'));
        const cpuMetrics = data.metrics.filter(m => m.name === 'system.cpu.usage');
        
        expect(memoryMetrics.length).toBeGreaterThan(0);
        expect(cpuMetrics.length).toBeGreaterThan(0);

        agent.stopMonitoring();
        done();
      });
    });

    it.skip('should collect throughput metrics', (done) => {
      agent.startMonitoring();

      // Simulate some requests
      agent.captureRequest('/api/test1', 'GET', 200, 50);
      agent.captureRequest('/api/test2', 'POST', 201, 75);

      // Wait for at least one more collection cycle to calculate throughput
      setTimeout(() => {
        const data = agent.getBufferedData();
        const throughputMetric = data.metrics.find(m => m.name === 'http.throughput');
        
        // Throughput metric should exist after a collection cycle
        expect(throughputMetric).toBeDefined();
        expect(throughputMetric?.value).toBeGreaterThanOrEqual(0);

        agent.stopMonitoring();
        done();
      }, 1200); // Wait slightly longer than the monitoring interval
    }, 5000);
  });

  describe('Circular Buffer', () => {
    it('should store data in circular buffer', () => {
      for (let i = 0; i < 10; i++) {
        agent.captureRequest(`/api/test${i}`, 'GET', 200, 100);
      }

      const stats = agent.getBufferStats();
      expect(stats.metricsCount).toBeGreaterThan(0);
      expect(stats.metricsCount).toBeLessThanOrEqual(config.monitoring.bufferSize);
    });

    it('should overwrite oldest data when buffer is full', () => {
      const smallConfig = { ...config };
      smallConfig.monitoring.bufferSize = 5;
      const mockSmallClient = new APIClient('test-key') as jest.Mocked<APIClient>;
      mockSmallClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);
      const smallAgent = new MonitoringAgent(smallConfig, mockSmallClient);

      // Add more items than buffer capacity
      for (let i = 0; i < 10; i++) {
        smallAgent.captureRequest(`/api/test${i}`, 'GET', 200, 100);
      }

      const stats = smallAgent.getBufferStats();
      // Each request creates 2 metrics, so buffer should be full
      expect(stats.metricsCount).toBe(5);
    });
  });

  describe('Buffer Management', () => {
    it('should clear buffer', () => {
      agent.captureRequest('/api/test', 'GET', 200, 100);
      agent.captureError(new Error('Test'));

      let stats = agent.getBufferStats();
      expect(stats.metricsCount).toBeGreaterThan(0);
      expect(stats.errorsCount).toBeGreaterThan(0);

      agent.clearBuffer();

      stats = agent.getBufferStats();
      expect(stats.metricsCount).toBe(0);
      expect(stats.errorsCount).toBe(0);
    });

    it('should indicate when buffer should flush (time threshold)', (done) => {
      const quickConfig = { ...config };
      quickConfig.monitoring.interval = 100;
      const mockQuickClient = new APIClient('test-key') as jest.Mocked<APIClient>;
      mockQuickClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);
      const quickAgent = new MonitoringAgent(quickConfig, mockQuickClient);

      quickAgent.captureRequest('/api/test', 'GET', 200, 100);

      // Should not flush immediately
      expect(quickAgent.shouldFlush()).toBe(false);

      // Should flush after interval
      setTimeout(() => {
        expect(quickAgent.shouldFlush()).toBe(true);
        done();
      }, 150);
    });

    it('should indicate when buffer should flush (capacity)', () => {
      const smallConfig = { ...config };
      smallConfig.monitoring.bufferSize = 2;
      const mockSmallClient = new APIClient('test-key') as jest.Mocked<APIClient>;
      mockSmallClient.transmitMonitoringData = jest.fn().mockResolvedValue(undefined);
      const smallAgent = new MonitoringAgent(smallConfig, mockSmallClient);

      // Fill buffer (each request creates 2 metrics)
      smallAgent.captureRequest('/api/test', 'GET', 200, 100);

      expect(smallAgent.shouldFlush()).toBe(true);
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring', () => {
      agent.startMonitoring();
      // Starting again should be idempotent
      agent.startMonitoring();

      agent.stopMonitoring();
      // Stopping again should be safe
      agent.stopMonitoring();
    });
  });
});

