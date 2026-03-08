# VigilAI - System Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│                     http://localhost:5500                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Frontend (HTML/CSS/JS)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pages: dashboard, incidents, pull-requests, apps, etc.  │  │
│  │  • Brutalist Design with Dark/Light Mode                 │  │
│  │  • Real-time Updates                                     │  │
│  │  • Responsive Layout                                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  JavaScript Modules: auth, api-client, pages, utils     │  │
│  │  • Theme Manager (Dark/Light Mode)                       │  │
│  │  • API Client with JWT Auth                             │  │
│  │  • Page-specific Controllers                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests + JWT Token
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                   Backend (Next.js 14 - Port 3000)              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes:                                             │  │
│  │  • /api/auth/* - Authentication (JWT)                    │  │
│  │  • /api/dashboard/stats - Dashboard metrics              │  │
│  │  • /api/incidents/* - Incident CRUD + AI Analysis        │  │
│  │  • /api/incidents/[id]/analyze - AI Diagnosis + PR Gen   │  │
│  │  • /api/applications/* - App management                  │  │
│  │  • /api/api-keys/* - SDK API key management              │  │
│  │  • /api/pull-requests/* - PR tracking                    │  │
│  │  • /api/events - SDK event ingestion                     │  │
│  │  • /api/settings/* - User preferences                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AI Integration:                                         │  │
│  │  • AWS Bedrock (Claude) for error analysis               │  │
│  │  • Code fix generation                                   │  │
│  │  • Root cause diagnosis                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GitHub Integration:                                     │  │
│  │  • Octokit for PR creation                               │  │
│  │  • File path resolution from stack traces                │  │
│  │  • Automatic branch creation                             │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ SQL Queries (Prisma ORM)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Database (PostgreSQL)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tables:                                                 │  │
│  │  • User - User accounts with JWT auth                    │  │
│  │  • Application - Monitored apps with GitHub config       │  │
│  │  • Incident - Errors with AI diagnosis                   │  │
│  │  • ApiKey - SDK authentication keys                      │  │
│  │  • PullRequest - Generated fixes and PRs                 │  │
│  │  • Settings - User preferences (theme, notifications)    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              External: User's Application (Monitored)           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  VigilAI SDK (Python or TypeScript)                      │  │
│  │  • Monitors HTTP requests/responses                      │  │
│  │  • Captures errors with stack traces                     │  │
│  │  • Tracks custom metrics                                 │  │
│  │  • Sends data to Backend API (/api/events)               │  │
│  │  • Non-blocking, buffered transmission                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AWS Bedrock (Claude)                                    │  │
│  │  • AI-powered error analysis                             │  │
│  │  • Code fix generation                                   │  │
│  │  • Root cause diagnosis                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GitHub API                                              │  │
│  │  • Repository access                                     │  │
│  │  • Pull request creation                                 │  │
│  │  • File content management                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Request Flow

### User Authentication Flow

```
1. User visits /login.html
   │
   ▼
2. Enters credentials
   │
   ▼
3. Frontend sends POST to /api/auth/login
   │
   ▼
4. Backend validates credentials
   │
   ▼
5. Backend creates session token
   │
   ▼
6. Frontend stores token in localStorage
   │
   ▼
7. Frontend redirects to /dashboard.html
```

### Dashboard Data Flow

```
1. User visits /dashboard.html
   │
   ▼
2. Frontend checks for auth token
   │
   ▼
3. Frontend requests GET /api/dashboard/stats
   │
   ▼
4. Backend validates token
   │
   ▼
5. Backend queries database via Prisma
   │
   ▼
6. Database returns data
   │
   ▼
7. Backend formats and returns JSON
   │
   ▼
8. Frontend renders charts and metrics
```

### Incident Creation Flow (from SDK)

```
1. Error occurs in user's application
   │
   ▼
2. SDK captures error details (stack trace, context)
   │
   ▼
3. SDK sends POST to /api/events with API key
   │
   ▼
4. Backend validates API key
   │
   ▼
5. Backend creates incident in database
   │
   ▼
6. Dashboard shows new incident
```

### AI-Powered PR Generation Flow

```
1. User clicks "Analyze" on incident
   │
   ▼
2. Frontend sends POST to /api/incidents/[id]/analyze
   │
   ▼
3. Backend extracts file path from stack trace
   │  • Tries multiple path variants (platform/app/*, app/*, etc.)
   │  • Validates file exists on GitHub
   │
   ▼
4. Backend fetches file content from GitHub
   │
   ▼
5. Backend sends to AWS Bedrock (Claude) with:
   │  • Error message
   │  • Stack trace
   │  • File content
   │  • Context
   │
   ▼
6. AWS Bedrock analyzes and generates:
   │  • Root cause diagnosis
   │  • Code fix
   │  • Explanation
   │
   ▼
7. Backend creates GitHub branch
   │  • Branch name: vigilai-fix-{incident-id}
   │
   ▼
8. Backend commits fix to branch
   │
   ▼
9. Backend creates Pull Request
   │  • Title: "VigilAI Fix: {error-title}"
   │  • Body: Diagnosis + explanation
   │  • Labels: automated-fix, vigilai
   │
   ▼
10. Backend saves PR info to database
   │
   ▼
11. Frontend shows PR link and status
```

## 📦 Component Details

### Frontend Architecture

```
frontend/
├── HTML Pages (Views)
│   ├── login.html
│   ├── signup.html
│   ├── dashboard.html
│   ├── incidents.html
│   ├── applications.html
│   ├── api_key.html
│   └── settings.html
│
├── JavaScript Modules
│   ├── config.js - Configuration
│   ├── auth.js - Authentication logic
│   ├── api-client.js - HTTP client
│   ├── app.js - Main app logic
│   ├── modal.js - Modal dialogs
│   ├── toast.js - Notifications
│   ├── storage.js - LocalStorage wrapper
│   │
│   ├── pages/ - Page-specific logic
│   │   ├── dashboard.js
│   │   ├── incidents.js
│   │   ├── applications.js
│   │   ├── api-keys.js
│   │   ├── pull-requests.js
│   │   └── settings.js
│   │
│   └── utils/ - Utility functions
│       ├── formatters.js
│       └── validators.js
│
└── Tests
    └── *.test.js - Jest tests
```

### Backend Architecture

```
platform/
├── app/ - Next.js App Router
│   ├── api/ - API Routes
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── signup/route.ts
│   │   │   └── me/route.ts
│   │   ├── dashboard/
│   │   │   └── stats/route.ts
│   │   ├── incidents/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── applications/route.ts
│   │   ├── api-keys/route.ts
│   │   ├── pull-requests/route.ts
│   │   └── settings/route.ts
│   │
│   ├── (auth)/ - Auth pages
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   │
│   └── (dashboard)/ - Dashboard pages
│       ├── layout.tsx
│       ├── dashboard/page.tsx
│       ├── incidents/page.tsx
│       ├── applications/page.tsx
│       ├── api-keys/page.tsx
│       ├── pull-requests/page.tsx
│       └── settings/page.tsx
│
├── lib/ - Utilities
│   ├── auth.ts - NextAuth config
│   ├── auth-helpers.ts - Auth utilities
│   ├── prisma.ts - Prisma client
│   └── errors.ts - Error handling
│
├── prisma/
│   ├── schema.prisma - Database schema
│   └── migrations/ - Database migrations
│
└── middleware.ts - Request middleware
```

### Database Schema

```
┌─────────────┐
│    User     │
├─────────────┤
│ id          │──┐
│ email       │  │
│ password    │  │
│ name        │  │
│ createdAt   │  │
└─────────────┘  │
                 │
                 │ 1:N
                 │
┌────────────────▼──┐
│   Application     │
├───────────────────┤
│ id                │──┐
│ userId            │  │
│ name              │  │
│ apiKey            │  │
│ createdAt         │  │
└───────────────────┘  │
                       │ 1:N
                       │
┌──────────────────────▼──┐
│      Incident           │
├─────────────────────────┤
│ id                      │
│ applicationId           │
│ title                   │
│ description             │
│ severity                │
│ status                  │
│ stackTrace              │
│ createdAt               │
└─────────────────────────┘
```

## 🔐 Security Architecture

```
┌─────────────────────────────────────────┐
│         Security Layers                 │
└─────────────────────────────────────────┘

1. Frontend
   ├── Input validation
   ├── XSS prevention
   └── CSRF tokens

2. Network
   ├── HTTPS (production)
   ├── CORS configuration
   └── Rate limiting

3. Backend
   ├── Authentication (NextAuth)
   ├── Authorization checks
   ├── Input sanitization
   └── SQL injection prevention (Prisma)

4. Database
   ├── Encrypted connections
   ├── Password hashing (bcrypt)
   └── API key hashing

5. SDK
   ├── Data redaction
   ├── Secure transmission
   └── API key validation
```

## 🚀 Deployment Architecture (Production)

```
┌─────────────────────────────────────────────────────────┐
│                    CDN / Edge Network                   │
│                  (Frontend Static Files)                │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                   Load Balancer                         │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
┌────────▼────────┐            ┌────────▼────────┐
│  Backend Server │            │  Backend Server │
│   (Next.js)     │            │   (Next.js)     │
└────────┬────────┘            └────────┬────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Managed PostgreSQL Database                │
│                  (with replicas)                        │
└─────────────────────────────────────────────────────────┘
```

## 📊 Technology Stack

### Frontend
- **Language**: JavaScript (ES6+)
- **Testing**: Jest
- **HTTP Client**: Fetch API
- **Storage**: LocalStorage
- **Styling**: CSS3

### Backend
- **Framework**: Next.js 14
- **Language**: TypeScript
- **ORM**: Prisma
- **Auth**: NextAuth.js v5
- **Validation**: Zod
- **Real-time**: Socket.io (future)

### Database
- **DBMS**: PostgreSQL 15+
- **Migrations**: Prisma Migrate
- **Admin**: Prisma Studio

### SDKs
- **Python**: 3.8+
- **TypeScript**: 4.5+
- **Testing**: pytest, Jest

## 🔄 Data Flow Patterns

### Synchronous (REST API)
```
Frontend → Backend → Database → Backend → Frontend
```

### Asynchronous (Future WebSocket)
```
SDK → Backend → Database
                  ↓
            WebSocket Server
                  ↓
              Frontend
```

### Batch Processing (Future)
```
SDK → Queue → Worker → AI Service → Database → PR Creation
```

## 📈 Scalability Considerations

1. **Horizontal Scaling**: Multiple backend instances behind load balancer
2. **Database**: Read replicas for queries, primary for writes
3. **Caching**: Redis for session storage and frequently accessed data
4. **CDN**: Static frontend files served from edge locations
5. **Queue**: Message queue for async processing (incidents, AI analysis)

## 🎯 Performance Optimizations

1. **Frontend**:
   - Lazy loading of JavaScript modules
   - Debounced API calls
   - LocalStorage caching
   - Optimistic UI updates

2. **Backend**:
   - Database query optimization
   - Connection pooling
   - Response caching
   - Pagination for large datasets

3. **Database**:
   - Indexed columns
   - Optimized queries
   - Connection pooling
   - Query result caching

---

For more details, see [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)


## 🎨 Frontend Design System

### Brutalist Design Philosophy
- **Bold borders**: 2px black borders throughout
- **Sharp corners**: No border-radius
- **High contrast**: Black and white primary colors
- **Brutal shadows**: `shadow-brutal` (3px 3px 0 rgba(0,0,0,1))
- **Monospace fonts**: JetBrains Mono for code/data
- **Grid backgrounds**: Paper-grid pattern on main content

### Dark/Light Mode Implementation
```
Theme System:
├── CSS Variables (theme.css)
│   ├── Light Mode
│   │   ├── --bg-primary: #fafafa
│   │   ├── --bg-secondary: #ffffff
│   │   ├── --bg-sidebar: #f1f0ea
│   │   ├── --text-primary: #0a0a0a
│   │   └── --border-primary: #000000
│   │
│   └── Dark Mode
│       ├── --bg-primary: #0f0f0f
│       ├── --bg-secondary: #1a1a1a
│       ├── --bg-sidebar: #1a1a1a
│       ├── --text-primary: #f5f5f5
│       └── --border-primary: #404040
│
├── Theme Manager (theme.js)
│   ├── localStorage persistence
│   ├── Cross-tab synchronization
│   └── Smooth transitions
│
└── Settings Page Toggle
    └── User preference saved
```

### Component Structure
```
Page Layout:
┌─────────────────────────────────────┐
│  Sidebar (256px)                    │
│  ├── Logo + Title (89px height)     │
│  ├── Navigation Links               │
│  └── User Profile                   │
├─────────────────────────────────────┤
│  Main Content                       │
│  ├── Header (89px height)           │
│  │   ├── Page Title                 │
│  │   ├── Breadcrumbs                │
│  │   └── Actions                    │
│  │                                   │
│  └── Content Area                   │
│      └── Paper Grid Background      │
└─────────────────────────────────────┘
```

## 🔧 SDK Architecture

### TypeScript SDK Structure
```
@vigilai/sdk
├── vigilai.ts - Main SDK class
├── monitoring-agent.ts - Metrics collection
├── anomaly-detector.ts - Statistical analysis
├── api-client.ts - HTTP client
├── redactor.ts - PII redaction
└── types.ts - TypeScript definitions

Features:
• Express.js middleware
• Next.js middleware
• Manual instrumentation
• Non-blocking operation
• Buffered transmission
• Health checks
```

### Python SDK Structure
```
vigilai-sdk
├── vigilai.py - Main SDK class
├── monitoring_agent.py - Metrics collection
├── anomaly_detector.py - Statistical analysis
├── api_client.py - HTTP client
├── redactor.py - PII redaction
└── types.py - Type definitions

Features:
• Django middleware
• FastAPI middleware
• Manual instrumentation
• Async/await support
• Buffered transmission
• Health checks
```

### SDK Data Flow
```
Application Error
      ↓
SDK Captures
      ↓
Buffer (1000 events)
      ↓
Batch Transmission (every 60s)
      ↓
Backend API (/api/events)
      ↓
Database (Incident created)
      ↓
Dashboard (Real-time update)
```

## 🤖 AI Integration Details

### AWS Bedrock Configuration
```javascript
{
  modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
  region: "us-east-1",
  
  request: {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4096,
    temperature: 0.7,
    
    messages: [{
      role: "user",
      content: `Analyze this error and generate a fix:
        
        Error: ${incident.message}
        Stack Trace: ${incident.stackTrace}
        File Content: ${fileContent}
        
        Provide:
        1. Root cause analysis
        2. Fixed code
        3. Explanation`
    }]
  }
}
```

### AI Response Processing
```
1. Parse AI response (JSON)
   ├── rootCause: string
   ├── fixedCode: string
   ├── explanation: string
   └── confidence: number

2. Validate fixed code
   ├── Syntax check
   ├── Length validation
   └── Diff generation

3. Create GitHub PR
   ├── Branch creation
   ├── File commit
   └── PR creation

4. Save to database
   ├── Update incident
   ├── Create PullRequest record
   └── Link to incident
```

## 🔐 Security Implementation

### Authentication Flow
```
1. User Login
   ├── POST /api/auth/login
   ├── Validate credentials (bcrypt)
   ├── Generate JWT token
   └── Return token + user data

2. Protected Routes
   ├── Extract JWT from Authorization header
   ├── Verify token signature
   ├── Check expiration
   └── Attach user to request

3. SDK Authentication
   ├── API Key in request header
   ├── Validate against database
   ├── Check application association
   └── Allow/deny request
```

### Data Protection
```
1. Passwords
   └── bcrypt hashing (10 rounds)

2. API Keys
   └── SHA-256 hashing

3. JWT Tokens
   ├── HS256 algorithm
   ├── 7-day expiration
   └── Secure secret key

4. PII Redaction (SDK)
   ├── Email addresses
   ├── Phone numbers
   ├── Credit card numbers
   └── Custom patterns
```

## 📊 Database Schema (Detailed)

### Core Tables

#### User
```sql
CREATE TABLE "User" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Application
```sql
CREATE TABLE "Application" (
  id TEXT PRIMARY KEY,
  userId TEXT REFERENCES "User"(id),
  name TEXT NOT NULL,
  description TEXT,
  githubOwner TEXT,
  githubRepo TEXT,
  githubBranch TEXT DEFAULT 'main',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

#### Incident
```sql
CREATE TABLE "Incident" (
  id TEXT PRIMARY KEY,
  applicationId TEXT REFERENCES "Application"(id),
  title TEXT NOT NULL,
  message TEXT,
  stackTrace TEXT,
  severity TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  aiDiagnosis TEXT,
  suggestedFix TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  resolvedAt TIMESTAMP
);
```

#### ApiKey
```sql
CREATE TABLE "ApiKey" (
  id TEXT PRIMARY KEY,
  applicationId TEXT REFERENCES "Application"(id),
  name TEXT NOT NULL,
  keyHash TEXT NOT NULL,
  keyPrefix TEXT NOT NULL,
  lastUsed TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  revokedAt TIMESTAMP
);
```

#### PullRequest
```sql
CREATE TABLE "PullRequest" (
  id TEXT PRIMARY KEY,
  incidentId TEXT REFERENCES "Incident"(id),
  title TEXT NOT NULL,
  description TEXT,
  githubPrNumber INTEGER,
  githubPrUrl TEXT,
  branchName TEXT,
  status TEXT DEFAULT 'open',
  createdAt TIMESTAMP DEFAULT NOW(),
  mergedAt TIMESTAMP
);
```

## 🚀 Deployment Guide

### Development Setup
```bash
# 1. Clone repository
git clone https://github.com/techiepookie/vigilai.git
cd vigilai

# 2. Install dependencies
cd platform && npm install
cd ../frontend && npm install
cd ../typescript && npm install
cd ../python && pip install -e .

# 3. Setup database
cd platform
npx prisma migrate dev
npx prisma generate

# 4. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 5. Start services
npm run dev  # Backend (port 3000)
# In another terminal:
cd frontend && npx live-server --port=5500
```

### Production Deployment

#### Option 1: Vercel (Recommended for Backend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy backend
cd platform
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Option 2: Docker
```dockerfile
# Dockerfile for backend
FROM node:18-alpine
WORKDIR /app
COPY platform/package*.json ./
RUN npm ci --only=production
COPY platform .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

#### Option 3: Traditional Server
```bash
# Build backend
cd platform
npm run build

# Start with PM2
pm2 start npm --name "vigilai-backend" -- start

# Serve frontend with nginx
# Configure nginx to serve frontend/ directory
```

### Environment Variables (Production)
```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="<strong-random-secret>"
JWT_SECRET="<strong-random-secret>"
GITHUB_TOKEN="<github-personal-access-token>"
AWS_ACCESS_KEY_ID="<aws-key>"
AWS_SECRET_ACCESS_KEY="<aws-secret>"

# Optional
NEXTAUTH_URL="https://your-domain.com"
FRONTEND_URL="https://your-frontend-domain.com"
```

## 📈 Performance Metrics

### Target Performance
- **API Response Time**: < 200ms (p95)
- **Dashboard Load Time**: < 2s
- **SDK Overhead**: < 5ms per request
- **Database Queries**: < 50ms (p95)
- **AI Analysis**: < 10s per incident

### Monitoring
- Application metrics via SDK
- Database query performance (Prisma)
- API endpoint latency
- Error rates and types
- User activity tracking

## 🔄 Future Enhancements

### Planned Features
1. **Real-time Updates**: WebSocket for live dashboard
2. **Advanced Analytics**: Trend analysis, pattern detection
3. **Team Collaboration**: Multi-user workspaces
4. **Notifications**: Slack, Discord, Email integrations
5. **Custom AI Models**: Fine-tuned models for specific frameworks
6. **Self-Hosted Option**: Docker Compose setup
7. **More SDKs**: Go, Ruby, Java, PHP
8. **Advanced Monitoring**: Distributed tracing, profiling

### Scalability Roadmap
1. **Phase 1** (Current): Single server, PostgreSQL
2. **Phase 2**: Load balancer, read replicas
3. **Phase 3**: Microservices, message queue
4. **Phase 4**: Kubernetes, auto-scaling
5. **Phase 5**: Multi-region deployment

---

## 📚 Additional Resources

- **[README.md](README.md)** - Project overview and quick start
- **[TypeScript SDK](typescript/README.md)** - TypeScript SDK documentation
- **[Python SDK](python/README.md)** - Python SDK documentation
- **[API Documentation](docs/reference.html)** - Complete API reference
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

---

**Last Updated**: 2024
**Version**: 1.0.0
**Maintainer**: VigilAI Team
