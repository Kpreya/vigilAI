import axios, { AxiosInstance } from 'axios';
import { MonitoringData } from './types';

/**
 * Queue for storing data when backend is unavailable
 */
class DataQueue<T> {
  private queue: T[] = [];
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  enqueue(item: T): void {
    if (this.queue.length >= this.maxSize) {
      // Drop oldest data (FIFO)
      this.queue.shift();
    }
    this.queue.push(item);
  }

  dequeue(): T | undefined {
    return this.queue.shift();
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  clear(): void {
    this.queue = [];
  }
}

/**
 * Client for communicating with VigilAI backend
 */
export class APIClient {
  private client: AxiosInstance;
  private apiKey: string;
  private localQueue: DataQueue<MonitoringData>;
  private isRetrying: boolean = false;

  constructor(apiKey: string, baseURL: string = 'https://api.vigilai.io') {
    this.apiKey = apiKey;
    this.localQueue = new DataQueue<MonitoringData>(1000);
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * Validate the API key with the backend
   */
  async validateAPIKey(): Promise<void> {
    try {
      const response = await this.client.get('/v1/auth/validate');
      if (response.status !== 200) {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw new Error('Invalid API key: Authentication failed');
        }
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          throw new Error('Unable to connect to VigilAI backend. Please check your network connection.');
        }
      }
      throw new Error(`API key validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send data to backend with retry logic and exponential backoff
   */
  async sendData(endpoint: string, data: unknown): Promise<void> {
    await this.sendWithRetry(endpoint, data);
  }

  /**
   * Transmit monitoring data with retry logic
   */
  async transmitMonitoringData(data: MonitoringData): Promise<void> {
    try {
      await this.sendWithRetry('/v1/monitoring/data', data);
      
      // If successful and queue has data, try to flush queue
      if (!this.localQueue.isEmpty() && !this.isRetrying) {
        this.flushQueue().catch(() => {
          // Ignore queue flush errors - will retry later
        });
      }
    } catch (error) {
      // Queue data locally when backend unavailable
      this.localQueue.enqueue(data);
      console.error('Failed to transmit data, queued locally:', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Send request with exponential backoff retry logic
   * Retry delays: 1s, 2s, 4s, 8s, 16s, max 32s
   */
  private async sendWithRetry(endpoint: string, data: unknown, maxRetries: number = 5): Promise<void> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.client.post(endpoint, data);
        return; // Success
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Don't retry on authentication errors
        if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
          throw lastError;
        }
        
        // If this was the last attempt, throw
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, max 32s
        const delay = Math.min(1000 * Math.pow(2, attempt), 32000);
        await this.sleep(delay);
      }
    }
    
    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Flush queued data to backend
   */
  private async flushQueue(): Promise<void> {
    if (this.isRetrying || this.localQueue.isEmpty()) {
      return;
    }
    
    this.isRetrying = true;
    
    try {
      while (!this.localQueue.isEmpty()) {
        const data = this.localQueue.dequeue();
        if (data) {
          await this.sendWithRetry('/v1/monitoring/data', data);
        }
      }
    } finally {
      this.isRetrying = false;
    }
  }

  /**
   * Get queue size for monitoring
   */
  getQueueSize(): number {
    return this.localQueue.size();
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
