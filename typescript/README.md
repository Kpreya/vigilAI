# VigilAI SDK for TypeScript/JavaScript

Automated incident detection, AI-powered diagnosis, and automatic code fix generation for Node.js applications.

## Features

- 🔍 **Automatic Monitoring** - Capture HTTP requests, errors, and system metrics
- 🚨 **Anomaly Detection** - Detect performance issues and errors using statistical analysis
- 🤖 **AI Diagnosis** - Get AI-powered root cause analysis for incidents
- 🔧 **Automated Fixes** - Generate code fixes using Kiro CLI
- 📝 **GitHub Integration** - Automatically create pull requests with fixes
- 🔒 **Privacy First** - Built-in PII redaction and data retention policies
- ⚡ **Non-Blocking** - Minimal performance impact on your application

## Installation

```bash
npm install @vigilai/sdk
```

## Quick Start

### Express.js

```typescript
import express from 'express';
import { VigilAI } from '@vigilai/sdk';

const app = express();

// Initialize VigilAI
const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY,
});

await vigilai.initialize();

// Add middleware
app.use(vigilai.expressMiddleware());

// Your routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(3000);
```

### Next.js

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { vigilai } from './lib/vigilai';

export async function middleware(request: NextRequest) {
  return vigilai.nextMiddleware(request, async (req) => {
    return NextResponse.next();
  });
}
```

### Manual Instrumentation

```typescript
import { VigilAI } from '@vigilai/sdk';

const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY,
});

await vigilai.initialize();

// Track custom metrics
vigilai.trackMetric('user.login.count', 1);
vigilai.trackMetric('cache.hit_rate', 0.95);

// Track errors
try {
  // Some operation
} catch (error) {
  vigilai.trackError(error as Error, {
    operation: 'database_query',
    userId: '12345'
  });
}
```

## Configuration

```typescript
const vigilai = new VigilAI({
  apiKey: 'your-api-key',
  
  // Monitoring configuration
  monitoring: {
    interval: 60000,        // Metric collection interval (ms)
    samplingRate: 1.0,      // Sample 100% of requests
    bufferSize: 1000,       // Max events in buffer
  },
  
  // Performance thresholds
  thresholds: {
    responseTime: 1000,     // Max response time (ms)
    errorRate: 5,           // Max error rate (%)
    memoryUsage: 500,       // Max memory usage (MB)
    cpuUsage: 80,           // Max CPU usage (%)
  },
  
  // Anomaly detection
  anomalyDetection: {
    sensitivity: 2,         // Z-score threshold
    deduplicationWindow: 300000, // 5 minutes
  },
  
  // Security
  security: {
    enablePIIRedaction: true,
    dataRetentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    redactionRules: [
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: '[SSN]' }
    ],
  },
});
```

## Advanced Features

### Anomaly Detection

```typescript
import { AnomalyDetector } from '@vigilai/sdk';

const detector = new AnomalyDetector({
  sensitivity: 2,
  deduplicationWindow: 300000,
});

// Analyze metrics for anomalies
const incidents = detector.analyzeMetrics(metrics, thresholds);

for (const incident of incidents) {
  console.log(`Incident detected: ${incident.type}`);
  console.log(`Severity: ${incident.severity}`);
  console.log(`Description: ${incident.description}`);
}
```

### AI Diagnosis

```typescript
import { AIDiagnostician } from '@vigilai/sdk';

const diagnostician = new AIDiagnostician({
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat',
});

const diagnosis = await diagnostician.diagnose(incident, metrics);

console.log(`Root cause: ${diagnosis.rootCause}`);
console.log(`Explanation: ${diagnosis.explanation}`);
console.log(`Confidence: ${diagnosis.confidence}`);
```

### Code Generation

```typescript
import { CodeGenerator } from '@vigilai/sdk';

const generator = new CodeGenerator();

const fixProposal = await generator.generateFix(diagnosis, codeFiles);

console.log(`Fix description: ${fixProposal.description}`);
for (const change of fixProposal.changes) {
  console.log(`Modified: ${change.path}`);
}
```

### GitHub Integration

```typescript
import { GitHubIntegrator } from '@vigilai/sdk';

const github = new GitHubIntegrator({
  token: process.env.GITHUB_TOKEN,
  owner: 'your-org',
  repo: 'your-repo',
  baseBranch: 'main',
  branchPrefix: 'vigilai-fix',
  labels: ['automated-fix', 'vigilai'],
  assignees: ['maintainer'],
});

const pr = await github.createFixPR(fixProposal, diagnosis);

console.log(`Pull request created: ${pr.url}`);
```

## Health Check

```typescript
const health = vigilai.healthCheck();

console.log(`Status: ${health.status}`);
console.log(`Buffer size: ${health.metrics.bufferSize}`);
console.log(`Success rate: ${health.metrics.transmissionSuccessRate}`);
```

## Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  await vigilai.shutdown();
  process.exit(0);
});
```

## API Reference

### VigilAI

Main SDK class for monitoring and incident management.

#### Methods

- `initialize()` - Initialize SDK and validate API key
- `expressMiddleware()` - Express.js middleware
- `nextMiddleware(request, handler)` - Next.js middleware
- `trackMetric(name, value)` - Track custom metric
- `trackError(error, context)` - Track error
- `healthCheck()` - Get SDK health status
- `shutdown()` - Graceful shutdown

### Configuration Options

See the Configuration section above for all available options.

## Requirements

- Node.js >= 16.0.0
- TypeScript >= 5.0.0 (for TypeScript projects)

## License

MIT

## Support

- Documentation: https://github.com/vigilai/sdk#readme
- Issues: https://github.com/vigilai/sdk/issues
- Email: support@vigilai.dev
