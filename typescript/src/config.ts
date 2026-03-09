import * as fs from 'fs';
import * as path from 'path';
import { VigilAIConfig, ResolvedConfig } from './types';

/**
 * Configuration loader that supports multiple sources with priority:
 * 1. Programmatic configuration (passed to constructor)
 * 2. Environment variables
 * 3. Configuration file (vigilai.config.json or vigilai.config.yaml)
 */
export class ConfigLoader {
  /**
   * Load and merge configuration from all sources
   */
  static load(programmaticConfig: VigilAIConfig): ResolvedConfig {
    // Start with defaults
    const config: ResolvedConfig = {
      apiKey: '',
      monitoring: {
        interval: 60000,
        samplingRate: 1.0,
        bufferSize: 1000,
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
        dataRetentionPeriod: 604800000, // 7 days in milliseconds
      },
    };

    // Load from config file (lowest priority)
    const fileConfig = this.loadFromFile();
    if (fileConfig) {
      this.mergeConfig(config, fileConfig);
    }

    // Load from environment variables (medium priority)
    const envConfig = this.loadFromEnv();
    this.mergeConfig(config, envConfig);

    // Apply programmatic config (highest priority)
    this.mergeConfig(config, programmaticConfig);

    // Validate configuration
    this.validate(config);

    return config;
  }

  /**
   * Load configuration from file
   */
  private static loadFromFile(): Partial<VigilAIConfig> | null {
    const configPaths = [
      'vigilai.config.json',
      'vigilai.config.yaml',
      '.vigilai.json',
    ];

    for (const configPath of configPaths) {
      const fullPath = path.join(process.cwd(), configPath);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          if (configPath.endsWith('.json')) {
            return JSON.parse(content);
          }
          // YAML parsing would require a library, skip for now
        } catch (error) {
          console.warn(`Failed to load config from ${configPath}:`, error);
        }
      }
    }

    return null;
  }

  /**
   * Load configuration from environment variables
   */
  private static loadFromEnv(): Partial<VigilAIConfig> {
    const config: Partial<VigilAIConfig> = {};

    if (process.env.VIGILAI_API_KEY) {
      config.apiKey = process.env.VIGILAI_API_KEY;
    }

    if (process.env.VIGILAI_GITHUB_TOKEN) {
      config.github = {
        token: process.env.VIGILAI_GITHUB_TOKEN,
        owner: process.env.VIGILAI_GITHUB_OWNER || '',
        repo: process.env.VIGILAI_GITHUB_REPO || '',
      };
    }

    if (process.env.VIGILAI_MONITORING_INTERVAL) {
      config.monitoring = {
        interval: parseInt(process.env.VIGILAI_MONITORING_INTERVAL, 10),
      };
    }

    if (process.env.VIGILAI_THRESHOLD_RESPONSE_TIME) {
      config.thresholds = {
        responseTime: parseInt(process.env.VIGILAI_THRESHOLD_RESPONSE_TIME, 10),
      };
    }

    return config;
  }

  /**
   * Merge source config into target config
   */
  private static mergeConfig(target: ResolvedConfig, source: Partial<VigilAIConfig>): void {
    if (source.apiKey) {
      target.apiKey = source.apiKey;
    }

    if (source.github) {
      target.github = {
        token: source.github.token,
        owner: source.github.owner,
        repo: source.github.repo,
        baseBranch: source.github.baseBranch || 'main',
        branchPrefix: source.github.branchPrefix || 'vigilai-fix',
        labels: source.github.labels || [],
        assignees: source.github.assignees || [],
      };
    }

    if (source.monitoring) {
      if (source.monitoring.interval !== undefined) {
        target.monitoring.interval = source.monitoring.interval;
      }
      if (source.monitoring.samplingRate !== undefined) {
        target.monitoring.samplingRate = source.monitoring.samplingRate;
      }
      if (source.monitoring.bufferSize !== undefined) {
        target.monitoring.bufferSize = source.monitoring.bufferSize;
      }
    }

    if (source.thresholds) {
      if (source.thresholds.responseTime !== undefined) {
        target.thresholds.responseTime = source.thresholds.responseTime;
      }
      if (source.thresholds.errorRate !== undefined) {
        target.thresholds.errorRate = source.thresholds.errorRate;
      }
      if (source.thresholds.memoryUsage !== undefined) {
        target.thresholds.memoryUsage = source.thresholds.memoryUsage;
      }
      if (source.thresholds.cpuUsage !== undefined) {
        target.thresholds.cpuUsage = source.thresholds.cpuUsage;
      }
    }

    if (source.anomalyDetection) {
      if (source.anomalyDetection.sensitivity !== undefined) {
        target.anomalyDetection.sensitivity = source.anomalyDetection.sensitivity;
      }
      if (source.anomalyDetection.deduplicationWindow !== undefined) {
        target.anomalyDetection.deduplicationWindow = source.anomalyDetection.deduplicationWindow;
      }
    }

    if (source.security) {
      if (source.security.redactionRules !== undefined) {
        target.security.redactionRules = source.security.redactionRules;
      }
      if (source.security.enablePIIRedaction !== undefined) {
        target.security.enablePIIRedaction = source.security.enablePIIRedaction;
      }
      if (source.security.dataRetentionPeriod !== undefined) {
        target.security.dataRetentionPeriod = source.security.dataRetentionPeriod;
      }
    }
  }

  /**
   * Validate configuration
   */
  private static validate(config: ResolvedConfig): void {
    // API key is required
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required. Provide it via config, environment variable VIGILAI_API_KEY, or config file.');
    }

    // Validate monitoring interval
    if (config.monitoring.interval <= 0) {
      throw new Error('Monitoring interval must be positive');
    }

    // Validate sampling rate
    if (isNaN(config.monitoring.samplingRate) || config.monitoring.samplingRate < 0 || config.monitoring.samplingRate > 1) {
      throw new Error('Sampling rate must be between 0 and 1');
    }

    // Validate buffer size
    if (config.monitoring.bufferSize <= 0) {
      throw new Error('Buffer size must be positive');
    }

    // Validate thresholds
    if (config.thresholds.responseTime <= 0) {
      throw new Error('Response time threshold must be positive');
    }
    if (isNaN(config.thresholds.errorRate) || config.thresholds.errorRate < 0 || config.thresholds.errorRate > 100) {
      throw new Error('Error rate threshold must be between 0 and 100');
    }
    if (config.thresholds.memoryUsage <= 0) {
      throw new Error('Memory usage threshold must be positive');
    }
    if (isNaN(config.thresholds.cpuUsage) || config.thresholds.cpuUsage < 0 || config.thresholds.cpuUsage > 100) {
      throw new Error('CPU usage threshold must be between 0 and 100');
    }

    // Validate anomaly detection
    if (config.anomalyDetection.sensitivity <= 0) {
      throw new Error('Anomaly detection sensitivity must be positive');
    }
    if (config.anomalyDetection.deduplicationWindow <= 0) {
      throw new Error('Deduplication window must be positive');
    }

    // Validate GitHub config if provided
    if (config.github) {
      if (!config.github.token || config.github.token.trim() === '') {
        throw new Error('GitHub token is required when GitHub integration is configured');
      }
      if (!config.github.owner || config.github.owner.trim() === '') {
        throw new Error('GitHub owner is required when GitHub integration is configured');
      }
      if (!config.github.repo || config.github.repo.trim() === '') {
        throw new Error('GitHub repo is required when GitHub integration is configured');
      }
    }

    // Validate redaction rules (must be valid regex)
    for (const rule of config.security.redactionRules) {
      try {
        new RegExp(rule);
      } catch (error) {
        throw new Error(`Invalid redaction rule regex: ${rule}`);
      }
    }
  }
}
