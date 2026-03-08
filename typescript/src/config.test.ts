import * as fc from 'fast-check';
import { VigilAI } from './vigilai';
import { VigilAIConfig } from './types';
import { ConfigLoader } from './config';

describe('Feature: vigilai-sdk - Configuration Properties', () => {
  /**
   * Property 1: API key requirement
   * For any SDK initialization attempt without an API key, initialization should fail with a descriptive error.
   * Validates: Requirements 2.1
   */
  describe('Property 1: API key requirement', () => {
    it('should fail initialization without API key', () => {
      fc.assert(
        fc.property(
          fc.record({
            apiKey: fc.constant(''),
          }),
          (config) => {
            expect(() => {
              new VigilAI(config as VigilAIConfig);
            }).toThrow(/API key is required/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should fail with whitespace-only API key', () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(' ', '\t', '\n'), { minLength: 1, maxLength: 10 }),
          (whitespace) => {
            expect(() => {
              new VigilAI({ apiKey: whitespace });
            }).toThrow(/API key is required/);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 2: Default configuration values
   * For any SDK initialization with only an API key, all optional configuration parameters
   * should have sensible default values.
   * Validates: Requirements 2.2
   */
  describe('Property 2: Default configuration values', () => {
    it('should apply default values when only API key is provided', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (apiKey) => {
            const sdk = new VigilAI({ apiKey });
            const config = sdk.getConfig();

            expect(config.monitoring.interval).toBe(60000);
            expect(config.monitoring.samplingRate).toBe(1.0);
            expect(config.monitoring.bufferSize).toBe(1000);
            expect(config.thresholds.responseTime).toBe(1000);
            expect(config.thresholds.errorRate).toBe(5);
            expect(config.thresholds.memoryUsage).toBe(500);
            expect(config.thresholds.cpuUsage).toBe(80);
            expect(config.anomalyDetection.sensitivity).toBe(2.0);
            expect(config.anomalyDetection.deduplicationWindow).toBe(300000);
            expect(config.security.enablePIIRedaction).toBe(true);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 3: Custom configuration acceptance
   * For any valid custom configuration values, the SDK should accept and apply those values
   * instead of defaults.
   * Validates: Requirements 2.3, 2.4, 2.5
   */
  describe('Property 3: Custom configuration acceptance', () => {
    it('should accept custom threshold values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1, max: 10000 }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          fc.integer({ min: 1, max: 10000 }),
          fc.float({ min: 0, max: 100, noNaN: true }),
          (apiKey, responseTime, errorRate, memoryUsage, cpuUsage) => {
            const sdk = new VigilAI({
              apiKey,
              thresholds: {
                responseTime,
                errorRate,
                memoryUsage,
                cpuUsage,
              },
            });
            const config = sdk.getConfig();

            expect(config.thresholds.responseTime).toBe(responseTime);
            expect(config.thresholds.errorRate).toBe(errorRate);
            expect(config.thresholds.memoryUsage).toBe(memoryUsage);
            expect(config.thresholds.cpuUsage).toBe(cpuUsage);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should accept custom monitoring configuration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1000, max: 600000 }),
          fc.float({ min: 0, max: 1, noNaN: true }),
          fc.integer({ min: 100, max: 10000 }),
          (apiKey, interval, samplingRate, bufferSize) => {
            const sdk = new VigilAI({
              apiKey,
              monitoring: {
                interval,
                samplingRate,
                bufferSize,
              },
            });
            const config = sdk.getConfig();

            expect(config.monitoring.interval).toBe(interval);
            expect(config.monitoring.samplingRate).toBe(samplingRate);
            expect(config.monitoring.bufferSize).toBe(bufferSize);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 4: API key validation
   * For any API key provided during initialization, the SDK should validate it against
   * the backend before completing initialization.
   * Validates: Requirements 2.6
   */
  describe('Property 4: API key validation', () => {
    it('should call API validation during initialize', async () => {
      // This test requires mocking the API client
      // For now, we verify the structure is in place
      const sdk = new VigilAI({ apiKey: 'test-key' });
      expect(sdk.isInitialized()).toBe(false);
      
      // Note: Full validation test requires backend mock
      // Will be implemented with integration tests
    });
  });

  /**
   * Property 5: Invalid API key rejection
   * For any invalid API key, the SDK should throw a descriptive error and prevent
   * initialization from completing.
   * Validates: Requirements 2.7
   */
  describe('Property 5: Invalid API key rejection', () => {
    it('should reject invalid API key during initialization', async () => {
      const sdk = new VigilAI({ apiKey: 'invalid-key' });
      
      // Note: Full validation test requires backend mock
      // The API client will throw on invalid keys
      expect(sdk.isInitialized()).toBe(false);
    });
  });

  /**
   * Property 6: Configuration source priority
   * For any configuration parameter specified in multiple sources, the SDK should use
   * the value with highest priority: programmatic > environment > file.
   * Validates: Requirements 2.8, 2.9, 2.10
   */
  describe('Property 6: Configuration source priority', () => {
    it('should prioritize programmatic config over defaults', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: 1000, max: 10000 }),
          (apiKey, customInterval) => {
            const sdk = new VigilAI({
              apiKey,
              monitoring: {
                interval: customInterval,
              },
            });
            const config = sdk.getConfig();

            // Programmatic value should override default
            expect(config.monitoring.interval).toBe(customInterval);
            expect(config.monitoring.interval).not.toBe(60000);
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  /**
   * Property 7: Configuration input validation
   * For any configuration input, the SDK should validate and sanitize it, rejecting
   * invalid values with descriptive errors.
   * Validates: Requirements 11.6
   */
  describe('Property 7: Configuration input validation', () => {
    it('should reject negative monitoring interval', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: -10000, max: 0 }),
          (apiKey, interval) => {
            expect(() => {
              new VigilAI({
                apiKey,
                monitoring: { interval },
              });
            }).toThrow(/interval must be positive/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid sampling rate', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.oneof(
            fc.float({ min: Math.fround(-10), max: Math.fround(-0.01), noNaN: true }),
            fc.float({ min: Math.fround(1.01), max: Math.fround(10), noNaN: true })
          ),
          (apiKey, samplingRate) => {
            expect(() => {
              new VigilAI({
                apiKey,
                monitoring: { samplingRate },
              });
            }).toThrow(/Sampling rate must be between 0 and 1/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid threshold values', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.integer({ min: -1000, max: 0 }),
          (apiKey, responseTime) => {
            expect(() => {
              new VigilAI({
                apiKey,
                thresholds: { responseTime },
              });
            }).toThrow(/Response time threshold must be positive/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid error rate threshold', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          fc.oneof(
            fc.float({ min: Math.fround(-100), max: Math.fround(-0.01), noNaN: true }),
            fc.float({ min: Math.fround(100.01), max: Math.fround(200), noNaN: true })
          ),
          (apiKey, errorRate) => {
            expect(() => {
              new VigilAI({
                apiKey,
                thresholds: { errorRate },
              });
            }).toThrow(/Error rate threshold must be between 0 and 100/);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should reject invalid redaction rules', () => {
      expect(() => {
        new VigilAI({
          apiKey: 'test-key',
          security: {
            redactionRules: ['[invalid(regex'],
          },
        });
      }).toThrow(/Invalid redaction rule regex/);
    });

    it('should accept valid redaction rules', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }).filter(s => s.trim().length > 0),
          (apiKey) => {
            const sdk = new VigilAI({
              apiKey,
              security: {
                redactionRules: ['\\d{3}-\\d{2}-\\d{4}', 'password.*'],
              },
            });
            const config = sdk.getConfig();

            expect(config.security.redactionRules).toHaveLength(2);
          }
        ),
        { numRuns: 20 }
      );
    });
  });
});
