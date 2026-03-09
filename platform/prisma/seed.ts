import { PrismaClient, Severity, IncidentStatus, PrStatus, TeamRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to hash API keys
function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

// Helper function to generate API key
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...');
  await prisma.pullRequest.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.metric.deleteMany();
  await prisma.apiKeyUsage.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.application.deleteMany();
  await prisma.notificationPreference.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Davis',
      password: hashedPassword,
      emailVerified: null, // Unverified user
    },
  });

  // Create notification preferences
  console.log('🔔 Creating notification preferences...');
  await prisma.notificationPreference.create({
    data: {
      userId: user1.id,
      emailEnabled: true,
      emailCritical: true,
      emailHigh: true,
      emailMedium: true,
      emailLow: false,
      slackEnabled: false,
      webhookEnabled: false,
    },
  });

  await prisma.notificationPreference.create({
    data: {
      userId: user2.id,
      emailEnabled: true,
      emailCritical: true,
      emailHigh: false,
      emailMedium: false,
      emailLow: false,
      slackEnabled: true,
      slackWebhook: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
      webhookEnabled: false,
    },
  });

  // Create applications
  console.log('📱 Creating applications...');
  const app1 = await prisma.application.create({
    data: {
      name: 'E-Commerce API',
      description: 'Main e-commerce backend API handling orders and payments',
      userId: user1.id,
      githubRepo: 'ecommerce-api',
      githubOwner: 'alice-company',
      anomalyThreshold: 2.5,
      enableAutoFix: true,
      enableNotifications: true,
    },
  });

  const app2 = await prisma.application.create({
    data: {
      name: 'Mobile App Backend',
      description: 'Backend services for iOS and Android mobile applications',
      userId: user1.id,
      githubRepo: 'mobile-backend',
      githubOwner: 'alice-company',
      anomalyThreshold: 2.0,
      enableAutoFix: true,
      enableNotifications: true,
    },
  });

  const app3 = await prisma.application.create({
    data: {
      name: 'Analytics Dashboard',
      description: 'Real-time analytics and reporting dashboard',
      userId: user2.id,
      githubRepo: 'analytics-dashboard',
      githubOwner: 'bob-corp',
      anomalyThreshold: 3.0,
      enableAutoFix: false,
      enableNotifications: true,
    },
  });

  const app4 = await prisma.application.create({
    data: {
      name: 'Customer Portal',
      description: 'Customer-facing web portal',
      userId: user2.id,
      anomalyThreshold: 2.0,
      enableAutoFix: true,
      enableNotifications: false,
    },
  });

  // Create API keys
  console.log('🔑 Creating API keys...');
  const apiKey1Raw = generateApiKey();
  const apiKey1 = await prisma.apiKey.create({
    data: {
      name: 'Production API Key',
      key: hashApiKey(apiKey1Raw),
      keyPrefix: apiKey1Raw.substring(0, 8),
      userId: user1.id,
      applicationId: app1.id,
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
  });

  const apiKey2Raw = generateApiKey();
  const apiKey2 = await prisma.apiKey.create({
    data: {
      name: 'Development API Key',
      key: hashApiKey(apiKey2Raw),
      keyPrefix: apiKey2Raw.substring(0, 8),
      userId: user1.id,
      applicationId: app2.id,
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
  });

  const apiKey3Raw = generateApiKey();
  const apiKey3 = await prisma.apiKey.create({
    data: {
      name: 'Analytics Key',
      key: hashApiKey(apiKey3Raw),
      keyPrefix: apiKey3Raw.substring(0, 8),
      userId: user2.id,
      applicationId: app3.id,
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
    },
  });

  const apiKey4Raw = generateApiKey();
  await prisma.apiKey.create({
    data: {
      name: 'Revoked Key',
      key: hashApiKey(apiKey4Raw),
      keyPrefix: apiKey4Raw.substring(0, 8),
      userId: user2.id,
      revokedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // Revoked 7 days ago
    },
  });

  // Create API key usage data
  console.log('📊 Creating API key usage data...');
  const now = Date.now();
  for (let i = 0; i < 24; i++) {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId: apiKey1.id,
        timestamp: new Date(now - 1000 * 60 * 60 * i),
        requests: Math.floor(Math.random() * 1000) + 100,
        dataVolume: BigInt(Math.floor(Math.random() * 10000000) + 1000000),
      },
    });
  }

  for (let i = 0; i < 12; i++) {
    await prisma.apiKeyUsage.create({
      data: {
        apiKeyId: apiKey2.id,
        timestamp: new Date(now - 1000 * 60 * 60 * i * 2),
        requests: Math.floor(Math.random() * 500) + 50,
        dataVolume: BigInt(Math.floor(Math.random() * 5000000) + 500000),
      },
    });
  }

  // Create incidents
  console.log('🚨 Creating incidents...');
  const incident1 = await prisma.incident.create({
    data: {
      applicationId: app1.id,
      severity: Severity.CRITICAL,
      status: IncidentStatus.OPEN,
      title: 'Database Connection Pool Exhausted',
      description: 'The application is unable to acquire database connections from the pool, causing request timeouts.',
      stackTrace: `Error: Connection pool exhausted
  at ConnectionPool.acquire (/app/db/pool.js:45:15)
  at Database.query (/app/db/database.js:23:28)
  at OrderService.createOrder (/app/services/order.js:67:18)
  at OrderController.create (/app/controllers/order.js:34:25)`,
      context: {
        environment: 'production',
        server: 'api-server-03',
        poolSize: 10,
        activeConnections: 10,
        queuedRequests: 47,
      },
      aiDiagnosis: 'The database connection pool is configured with a maximum of 10 connections, which is insufficient for the current load. The pool is exhausted with 47 requests waiting in queue.',
      suggestedFix: 'Increase the connection pool size to 50 and implement connection timeout handling.',
      confidence: 0.92,
      errorCount: 47,
      firstSeenAt: new Date(now - 1000 * 60 * 45),
      lastSeenAt: new Date(now - 1000 * 60 * 2),
    },
  });

  const incident2 = await prisma.incident.create({
    data: {
      applicationId: app1.id,
      severity: Severity.HIGH,
      status: IncidentStatus.IN_PROGRESS,
      title: 'Payment Gateway Timeout',
      description: 'Payment processing requests are timing out after 30 seconds.',
      stackTrace: `TimeoutError: Request timeout after 30000ms
  at PaymentGateway.processPayment (/app/services/payment.js:89:11)
  at PaymentController.process (/app/controllers/payment.js:56:23)`,
      context: {
        environment: 'production',
        gateway: 'stripe',
        timeout: 30000,
        averageResponseTime: 28500,
      },
      aiDiagnosis: 'The payment gateway is experiencing high latency, with average response times near the timeout threshold. This may be due to increased load or network issues.',
      suggestedFix: 'Increase timeout to 60 seconds and implement retry logic with exponential backoff.',
      confidence: 0.85,
      errorCount: 23,
      firstSeenAt: new Date(now - 1000 * 60 * 60 * 3),
      lastSeenAt: new Date(now - 1000 * 60 * 15),
    },
  });

  const incident3 = await prisma.incident.create({
    data: {
      applicationId: app2.id,
      severity: Severity.MEDIUM,
      status: IncidentStatus.RESOLVED,
      title: 'Image Upload Validation Error',
      description: 'Users are unable to upload profile images larger than 2MB.',
      stackTrace: `ValidationError: File size exceeds maximum allowed size
  at ImageValidator.validate (/app/validators/image.js:34:13)
  at UploadController.uploadImage (/app/controllers/upload.js:45:19)`,
      context: {
        environment: 'production',
        maxFileSize: 2097152,
        attemptedSize: 3145728,
      },
      aiDiagnosis: 'The file size validation is rejecting images larger than 2MB, but the error message is not user-friendly.',
      suggestedFix: 'Update the error message to clearly indicate the maximum file size and consider increasing the limit to 5MB.',
      confidence: 0.95,
      errorCount: 12,
      firstSeenAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
      lastSeenAt: new Date(now - 1000 * 60 * 60 * 24),
      resolvedAt: new Date(now - 1000 * 60 * 60 * 12),
    },
  });

  const incident4 = await prisma.incident.create({
    data: {
      applicationId: app2.id,
      severity: Severity.LOW,
      status: IncidentStatus.IGNORED,
      title: 'Deprecated API Warning',
      description: 'Using deprecated API endpoint /api/v1/users',
      stackTrace: null,
      context: {
        endpoint: '/api/v1/users',
        deprecatedSince: '2024-01-01',
        replacement: '/api/v2/users',
      },
      aiDiagnosis: 'The application is using a deprecated API endpoint that will be removed in the next major version.',
      suggestedFix: 'Update all references to use the new /api/v2/users endpoint.',
      confidence: 0.99,
      errorCount: 156,
      firstSeenAt: new Date(now - 1000 * 60 * 60 * 24 * 30),
      lastSeenAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
    },
  });

  const incident5 = await prisma.incident.create({
    data: {
      applicationId: app3.id,
      severity: Severity.HIGH,
      status: IncidentStatus.OPEN,
      title: 'Memory Leak in Data Processing',
      description: 'Memory usage continuously increases during large dataset processing.',
      stackTrace: `Error: JavaScript heap out of memory
  at DataProcessor.processLargeDataset (/app/services/processor.js:123:45)
  at AnalyticsController.generateReport (/app/controllers/analytics.js:78:12)`,
      context: {
        environment: 'production',
        heapUsed: 1800000000,
        heapTotal: 2048000000,
        datasetSize: 500000,
      },
      aiDiagnosis: 'The data processing function is not releasing memory properly, causing a memory leak when processing large datasets.',
      suggestedFix: 'Implement streaming data processing and add explicit garbage collection hints.',
      confidence: 0.88,
      errorCount: 8,
      firstSeenAt: new Date(now - 1000 * 60 * 60 * 6),
      lastSeenAt: new Date(now - 1000 * 60 * 30),
    },
  });

  const incident6 = await prisma.incident.create({
    data: {
      applicationId: app3.id,
      severity: Severity.CRITICAL,
      status: IncidentStatus.RESOLVED,
      title: 'Database Query Performance Degradation',
      description: 'Dashboard queries taking over 10 seconds to complete.',
      stackTrace: null,
      context: {
        environment: 'production',
        queryTime: 12500,
        threshold: 1000,
        affectedQueries: ['user_analytics', 'revenue_report'],
      },
      aiDiagnosis: 'Missing database indexes on frequently queried columns causing full table scans.',
      suggestedFix: 'Add composite indexes on user_id and created_at columns.',
      confidence: 0.94,
      errorCount: 34,
      firstSeenAt: new Date(now - 1000 * 60 * 60 * 24 * 5),
      lastSeenAt: new Date(now - 1000 * 60 * 60 * 24 * 3),
      resolvedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
    },
  });

  // Create pull requests
  console.log('🔀 Creating pull requests...');
  await prisma.pullRequest.create({
    data: {
      incidentId: incident2.id,
      githubPrNumber: 142,
      githubPrUrl: 'https://github.com/alice-company/ecommerce-api/pull/142',
      title: 'Fix: Increase payment gateway timeout and add retry logic',
      status: PrStatus.OPEN,
    },
  });

  await prisma.pullRequest.create({
    data: {
      incidentId: incident3.id,
      githubPrNumber: 87,
      githubPrUrl: 'https://github.com/alice-company/mobile-backend/pull/87',
      title: 'Fix: Improve image upload validation error messages',
      status: PrStatus.MERGED,
      mergedAt: new Date(now - 1000 * 60 * 60 * 12),
    },
  });

  await prisma.pullRequest.create({
    data: {
      incidentId: incident6.id,
      githubPrNumber: 23,
      githubPrUrl: 'https://github.com/bob-corp/analytics-dashboard/pull/23',
      title: 'Perf: Add database indexes for analytics queries',
      status: PrStatus.MERGED,
      mergedAt: new Date(now - 1000 * 60 * 60 * 24 * 2),
    },
  });

  // Create metrics
  console.log('📈 Creating metrics...');
  for (let i = 0; i < 48; i++) {
    const timestamp = new Date(now - 1000 * 60 * 30 * i); // Every 30 minutes
    
    // Metrics for app1
    await prisma.metric.create({
      data: {
        applicationId: app1.id,
        timestamp,
        responseTime: 150 + Math.random() * 100,
        errorRate: Math.random() * 2,
        requestCount: Math.floor(Math.random() * 1000) + 500,
        cpuUsage: 40 + Math.random() * 30,
        memoryUsage: 512 + Math.random() * 256,
      },
    });

    // Metrics for app2
    await prisma.metric.create({
      data: {
        applicationId: app2.id,
        timestamp,
        responseTime: 120 + Math.random() * 80,
        errorRate: Math.random() * 1.5,
        requestCount: Math.floor(Math.random() * 800) + 300,
        cpuUsage: 35 + Math.random() * 25,
        memoryUsage: 384 + Math.random() * 192,
      },
    });

    // Metrics for app3
    await prisma.metric.create({
      data: {
        applicationId: app3.id,
        timestamp,
        responseTime: 200 + Math.random() * 150,
        errorRate: Math.random() * 3,
        requestCount: Math.floor(Math.random() * 500) + 200,
        cpuUsage: 50 + Math.random() * 35,
        memoryUsage: 768 + Math.random() * 384,
      },
    });
  }

  // Create team members
  console.log('👥 Creating team members...');
  await prisma.teamMember.create({
    data: {
      userId: user1.id,
      role: TeamRole.OWNER,
      joinedAt: new Date(now - 1000 * 60 * 60 * 24 * 90),
    },
  });

  await prisma.teamMember.create({
    data: {
      userId: user2.id,
      role: TeamRole.ADMIN,
      invitedBy: user1.id,
      joinedAt: new Date(now - 1000 * 60 * 60 * 24 * 60),
    },
  });

  await prisma.teamMember.create({
    data: {
      userId: user3.id,
      role: TeamRole.MEMBER,
      invitedBy: user1.id,
      joinedAt: null, // Invited but not yet joined
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   Users: 3`);
  console.log(`   Applications: 4`);
  console.log(`   API Keys: 4 (1 revoked)`);
  console.log(`   Incidents: 6 (2 open, 1 in progress, 2 resolved, 1 ignored)`);
  console.log(`   Pull Requests: 3 (1 open, 2 merged)`);
  console.log(`   Metrics: ${48 * 3} data points`);
  console.log(`   Team Members: 3`);
  console.log('\n🔐 Test Credentials:');
  console.log(`   Email: alice@example.com`);
  console.log(`   Email: bob@example.com`);
  console.log(`   Email: charlie@example.com`);
  console.log(`   Password: password123`);
  console.log('\n🔑 API Keys (unhashed, save these for testing):');
  console.log(`   Production: ${apiKey1Raw}`);
  console.log(`   Development: ${apiKey2Raw}`);
  console.log(`   Analytics: ${apiKey3Raw}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
