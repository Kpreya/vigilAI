/**
 * Express.js Example with VigilAI SDK
 * 
 * This example demonstrates how to integrate VigilAI SDK with an Express.js application
 * for automatic monitoring, error tracking, and incident detection.
 */

import express from 'express';
import { VigilAI } from '@vigilai/sdk';

const app = express();
const port = 3000;

// Initialize VigilAI SDK
const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY || 'test-api-key',
  
  monitoring: {
    interval: 60000,        // Collect metrics every 60 seconds
    samplingRate: 1.0,      // Sample 100% of requests
    bufferSize: 1000,
  },
  
  thresholds: {
    responseTime: 1000,     // Alert if response time > 1000ms
    errorRate: 5,           // Alert if error rate > 5%
    memoryUsage: 500,       // Alert if memory > 500MB
    cpuUsage: 80,           // Alert if CPU > 80%
  },
  
  anomalyDetection: {
    sensitivity: 2,
    deduplicationWindow: 300000,
  },
  
  security: {
    enablePIIRedaction: true,
    dataRetentionPeriod: 7 * 24 * 60 * 60 * 1000,
  },
});

// Initialize SDK
async function initializeSDK() {
  try {
    await vigilai.initialize();
    console.log('VigilAI SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize VigilAI SDK:', error);
    process.exit(1);
  }
}

// Middleware
app.use(express.json());
app.use(vigilai.expressMiddleware());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello from Express with VigilAI!' });
});

app.get('/api/users', (req, res) => {
  // Simulate database query
  const users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ];
  
  res.json(users);
});

app.post('/api/users', (req, res) => {
  const { name } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Track custom metric
  vigilai.trackMetric('user.created', 1);
  
  res.status(201).json({ id: 3, name });
});

app.get('/api/slow', async (req, res) => {
  // Simulate slow endpoint
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ message: 'This was slow' });
});

app.get('/api/error', (req, res) => {
  // Simulate error
  throw new Error('Something went wrong!');
});

app.get('/api/custom-tracking', (req, res) => {
  try {
    // Track custom metrics
    vigilai.trackMetric('cache.hit_rate', 0.95);
    vigilai.trackMetric('queue.size', 42);
    
    res.json({ message: 'Custom metrics tracked' });
  } catch (error) {
    // Track error with context
    vigilai.trackError(error as Error, {
      endpoint: '/api/custom-tracking',
      userId: req.query.userId,
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  const health = vigilai.healthCheck();
  res.json(health);
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  await vigilai.shutdown();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  
  await vigilai.shutdown();
  
  process.exit(0);
});

// Start server
async function start() {
  await initializeSDK();
  
  app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });
}

start().catch(console.error);
