# VigilAI

<div align="center">

![VigilAI Logo](frontend/assets/vigilai_logo_dark_bg.png)

**AI-Powered Error Monitoring & Automated Code Fixes**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.8+-blue)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Architecture](#architecture) • [Contributing](#contributing)

</div>

---

## 🎯 Overview

VigilAI is an intelligent error monitoring and automated code fixing platform that combines real-time application monitoring with AI-powered diagnostics and automatic pull request generation. When your application encounters an error, VigilAI not only detects it but also analyzes the root cause and generates code fixes automatically.

### Key Capabilities

- 🔍 **Real-time Monitoring**: Capture errors, performance metrics, and system health
- 🤖 **AI-Powered Diagnosis**: AWS Bedrock analyzes errors and suggests fixes
- 🔧 **Automated Fixes**: Generate code fixes and create GitHub pull requests automatically
- 📊 **Beautiful Dashboard**: Brutalist-designed UI with dark/light mode
- 🔒 **Privacy-First**: Built-in PII redaction and data retention policies
- ⚡ **Non-Blocking**: Minimal performance impact on your application

---

## ✨ Features

### Monitoring & Detection
- Automatic error capture with full stack traces
- HTTP request/response monitoring
- System metrics (CPU, memory, response times)
- Anomaly detection using statistical analysis
- Custom metric tracking

### AI-Powered Analysis
- Root cause analysis using AWS Bedrock (Claude)
- Context-aware error diagnosis
- Confidence scoring for suggested fixes
- Historical pattern recognition

### Automated Remediation
- Automatic code fix generation
- GitHub pull request creation
- File path resolution from stack traces
- Multi-framework support (Express, Next.js, Django, FastAPI)

### Developer Experience
- Beautiful brutalist UI with dark/light mode
- Real-time incident dashboard
- Pull request tracking
- Application management
- API key management
- Comprehensive SDK documentation

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ (for platform and TypeScript SDK)
- Python 3.8+ (for Python SDK)
- PostgreSQL database
- AWS account (for Bedrock AI)
- GitHub account (for PR creation)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/Kpreya/vigilAI.git
cd vigilai
```

#### 2. Install Dependencies

```bash
# Platform (Next.js backend)
cd platform
npm install

# Frontend (HTML/CSS/JS)
cd ../frontend
npm install

# TypeScript SDK
cd ../typescript
npm install

# Python SDK
cd ../python
pip install -e .
```

#### 3. Configure Environment

Create `platform/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vigilai"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
NEXTAUTH_URL="http://localhost:3000"

# Frontend URL
FRONTEND_URL="http://localhost:5500"

# GitHub Integration
GITHUB_TOKEN="your-github-token"

# AWS Bedrock
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
```

#### 4. Setup Database

```bash
cd platform
npx prisma migrate dev
npx prisma generate
```

#### 5. Start the Platform

```bash
# Start Next.js backend
cd platform
npm run dev

# In another terminal, serve the frontend
cd frontend
npx live-server --port=5500
```

Visit:
- Frontend Dashboard: http://localhost:5500/dashboard.html
- Backend API: http://localhost:3000
- Documentation: Open `docs/index.html` in browser

---

## 📚 Documentation

### For Users
- **[Quick Start Guide](docs/index.html)** - Get started with VigilAI
- **[API Reference](docs/reference.html)** - Complete API documentation
- **[SDK Documentation](docs/index.html#frameworks)** - Framework integration guides

### For Developers
- **[Architecture](ARCHITECTURE.md)** - System architecture and design
- **[TypeScript SDK](typescript/README.md)** - TypeScript/JavaScript SDK
- **[Python SDK](python/README.md)** - Python SDK

---

## 🏗️ Architecture

VigilAI consists of four main components:

### 1. Platform (Next.js Backend)
- REST API for incident management
- Authentication & authorization
- Database management (Prisma + PostgreSQL)
- AI integration (AWS Bedrock)
- GitHub integration (Octokit)

### 2. Frontend (HTML/CSS/JS)
- Brutalist-designed dashboard
- Real-time incident monitoring
- Pull request tracking
- Application & API key management
- Dark/light mode support

### 3. SDKs
- **TypeScript/JavaScript**: Express, Next.js support
- **Python**: Django, FastAPI support
- Automatic error capture
- Custom metric tracking
- Non-blocking operation

### 4. AI Engine
- AWS Bedrock (Claude) for analysis
- Root cause diagnosis
- Code fix generation
- Confidence scoring

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

---

## 🔧 SDK Integration

### TypeScript/JavaScript

#### Express.js

```typescript
import express from 'express';
import { VigilAI } from '@vigilai/sdk';

const app = express();

const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY,
});

await vigilai.initialize();
app.use(vigilai.expressMiddleware());

app.listen(3000);
```

#### Next.js

```typescript
// middleware.ts
import { VigilAI } from '@vigilai/sdk';

const vigilai = new VigilAI({
  apiKey: process.env.VIGILAI_API_KEY,
});

export async function middleware(request: NextRequest) {
  return vigilai.nextMiddleware(request, async (req) => {
    return NextResponse.next();
  });
}
```

### Python

#### Django

```python
# settings.py
from vigilai import VigilAI, VigilAIConfig

vigilai = VigilAI(VigilAIConfig(
    api_key=os.environ.get('VIGILAI_API_KEY'),
))

MIDDLEWARE = [
    # ... other middleware
    vigilai.django_middleware(),
]
```

#### FastAPI

```python
from fastapi import FastAPI
from vigilai import VigilAI, VigilAIConfig

vigilai = VigilAI(VigilAIConfig(
    api_key=os.environ.get('VIGILAI_API_KEY'),
))

app = FastAPI()
app.middleware("http")(vigilai.fastapi_middleware())

@app.on_event("startup")
async def startup():
    await vigilai.initialize()
```

---

## 🎨 Features Showcase

### Dashboard
- Real-time incident monitoring
- System health metrics
- Application overview
- Quick actions

### Incident Management
- Detailed error information
- Stack trace analysis
- AI-powered diagnosis
- Status tracking

### Pull Request Automation
- Automatic PR creation
- Code fix suggestions
- GitHub integration
- Review workflow

### Dark Mode
- Professional dark theme
- Smooth transitions
- Consistent across all pages
- Theme persistence

---

## 🛠️ Development

### Project Structure

```
vigilai/
├── platform/          # Next.js backend
│   ├── app/          # Next.js app router
│   ├── prisma/       # Database schema
│   └── lib/          # Utilities
├── frontend/         # HTML/CSS/JS dashboard
│   ├── js/           # JavaScript modules
│   ├── css/          # Stylesheets
│   └── assets/       # Images and assets
├── typescript/       # TypeScript SDK
│   ├── src/          # Source code
│   ├── examples/     # Integration examples
│   └── dist/         # Compiled output
├── python/           # Python SDK
│   ├── src/vigilai/  # Source code
│   ├── examples/     # Integration examples
│   └── tests/        # Test suite
└── docs/             # Documentation site
```

### Running Tests

```bash
# TypeScript SDK
cd typescript
npm test

# Python SDK
cd python
pytest

# Platform (if tests exist)
cd platform
npm test
```

### Building

```bash
# TypeScript SDK
cd typescript
npm run build

# Python SDK
cd python
python setup.py sdist bdist_wheel

# Platform
cd platform
npm run build
```

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Ensure all tests pass
- Keep commits atomic and well-described

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **AWS Bedrock** for AI-powered analysis
- **Octokit** for GitHub integration
- **Prisma** for database management
- **Next.js** for the backend platform
- **Tailwind CSS** for styling

---

## 📧 Support

- **Documentation**: [docs/index.html](docs/index.html)
- **Issues**: [GitHub Issues](https://github.com/Kpreya/vigilAI/issues)
- **Email**: support@vigilai.dev

---

## 🗺️ Roadmap

- [ ] Slack/Discord notifications
- [ ] Multi-language support
- [ ] Custom AI models
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] Self-hosted option
- [ ] Kubernetes integration
- [ ] More framework support

---

<div align="center">

**Built with ❤️ by the VigilAI Team**

[Website](https://vigilai.dev) • [Documentation](docs/index.html) • [GitHub](https://github.com/Kpreya/vigilAI)

</div>
