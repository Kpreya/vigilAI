# VigilAI SDK for Python

Automated incident detection, AI-powered diagnosis, and automatic code fix generation for Python applications.

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
pip install vigilai-sdk
```

## Quick Start

### Django

```python
# settings.py
from vigilai import VigilAI, VigilAIConfig

vigilai = VigilAI(VigilAIConfig(
    api_key=os.environ.get('VIGILAI_API_KEY'),
))

# Add to middleware
MIDDLEWARE = [
    # ... other middleware
    vigilai.django_middleware(),
]
```

### FastAPI

```python
from fastapi import FastAPI
from vigilai import VigilAI, VigilAIConfig

app = FastAPI()

vigilai = VigilAI(VigilAIConfig(
    api_key=os.environ.get('VIGILAI_API_KEY'),
))

# Add middleware
app.middleware("http")(vigilai.fastapi_middleware())

@app.get("/")
async def root():
    return {"message": "Hello World"}
```

### Manual Instrumentation

```python
from vigilai import VigilAI, VigilAIConfig

vigilai = VigilAI(VigilAIConfig(
    api_key=os.environ.get('VIGILAI_API_KEY'),
))

await vigilai.initialize()

# Track custom metrics
vigilai.track_metric('user.login.count', 1)
vigilai.track_metric('cache.hit_rate', 0.95)

# Track errors
try:
    # Some operation
    pass
except Exception as error:
    vigilai.track_error(error, {
        'operation': 'database_query',
        'user_id': '12345'
    })
```

## Configuration

```python
from vigilai import VigilAI, VigilAIConfig
from vigilai.types import (
    MonitoringConfig,
    ThresholdsConfig,
    AnomalyDetectionConfig,
    SecurityConfig,
    RedactionRule
)

vigilai = VigilAI(VigilAIConfig(
    api_key='your-api-key',
    
    # Monitoring configuration
    monitoring=MonitoringConfig(
        interval=60000,        # Metric collection interval (ms)
        sampling_rate=1.0,     # Sample 100% of requests
        buffer_size=1000,      # Max events in buffer
    ),
    
    # Performance thresholds
    thresholds=ThresholdsConfig(
        response_time=1000,    # Max response time (ms)
        error_rate=5,          # Max error rate (%)
        memory_usage=500,      # Max memory usage (MB)
        cpu_usage=80,          # Max CPU usage (%)
    ),
    
    # Anomaly detection
    anomaly_detection=AnomalyDetectionConfig(
        sensitivity=2,         # Z-score threshold
        deduplication_window=300000,  # 5 minutes
    ),
    
    # Security
    security=SecurityConfig(
        enable_pii_redaction=True,
        data_retention_period=7 * 24 * 60 * 60 * 1000,  # 7 days
        redaction_rules=[
            RedactionRule(
                pattern=r'\b\d{3}-\d{2}-\d{4}\b',
                replacement='[SSN]'
            )
        ],
    ),
))
```

## Advanced Features

### Anomaly Detection

```python
from vigilai import AnomalyDetector
from vigilai.types import AnomalyDetectionConfig

detector = AnomalyDetector(AnomalyDetectionConfig(
    sensitivity=2,
    deduplication_window=300000,
))

# Analyze metrics for anomalies
incidents = detector.analyze_metrics(metrics, thresholds)

for incident in incidents:
    print(f"Incident detected: {incident.type}")
    print(f"Severity: {incident.severity}")
    print(f"Description: {incident.description}")
```

### AI Diagnosis

```python
from vigilai import AIDiagnostician

diagnostician = AIDiagnostician(
    api_key=os.environ.get('DEEPSEEK_API_KEY'),
    model='deepseek-chat',
)

diagnosis = await diagnostician.diagnose(incident, metrics)

print(f"Root cause: {diagnosis.root_cause}")
print(f"Explanation: {diagnosis.explanation}")
print(f"Confidence: {diagnosis.confidence}")
```

### Code Generation

```python
from vigilai import CodeGenerator

generator = CodeGenerator()

fix_proposal = await generator.generate_fix(diagnosis, code_files)

print(f"Fix description: {fix_proposal.description}")
for change in fix_proposal.changes:
    print(f"Modified: {change.path}")
```

### GitHub Integration

```python
from vigilai import GitHubIntegrator, GitHubConfig

github = GitHubIntegrator(GitHubConfig(
    token=os.environ.get('GITHUB_TOKEN'),
    owner='your-org',
    repo='your-repo',
    base_branch='main',
    branch_prefix='vigilai-fix',
    labels=['automated-fix', 'vigilai'],
    assignees=['maintainer'],
))

pr = github.create_fix_pr(fix_proposal, diagnosis)

print(f"Pull request created: {pr.url}")
```

## Health Check

```python
health = vigilai.health_check()

print(f"Status: {health.status}")
print(f"Buffer size: {health.metrics['bufferSize']}")
print(f"Success rate: {health.metrics['transmissionSuccessRate']}")
```

## Graceful Shutdown

```python
import signal
import asyncio

async def shutdown(sig, loop):
    await vigilai.shutdown()
    loop.stop()

loop = asyncio.get_event_loop()

for sig in (signal.SIGTERM, signal.SIGINT):
    loop.add_signal_handler(
        sig,
        lambda: asyncio.create_task(shutdown(sig, loop))
    )
```

## API Reference

### VigilAI

Main SDK class for monitoring and incident management.

#### Methods

- `initialize()` - Initialize SDK and validate API key
- `django_middleware()` - Django middleware
- `fastapi_middleware()` - FastAPI middleware
- `track_metric(name, value)` - Track custom metric
- `track_error(error, context)` - Track error
- `health_check()` - Get SDK health status
- `shutdown()` - Graceful shutdown

### Configuration Options

See the Configuration section above for all available options.

## Requirements

- Python >= 3.8
- Dependencies:
  - requests >= 2.31.0
  - pyyaml >= 6.0
  - psutil >= 5.9.0
  - PyGithub >= 2.1.0

## License

MIT

## Support

- Documentation: https://github.com/vigilai/sdk#readme
- Issues: https://github.com/vigilai/sdk/issues
- Email: support@vigilai.dev
