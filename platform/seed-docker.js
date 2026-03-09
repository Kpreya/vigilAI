const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Create admin user
  const hashedPassword = await bcrypt.hash('TestPass123!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'admin@vigilai.com' },
    update: {},
    create: {
      email: 'admin@vigilai.com',
      password: hashedPassword,
      name: 'Admin User'
    }
  });
  
  console.log('Created user:', user.email);

  // Create a test application
  const app = await prisma.application.upsert({
    where: { id: 'test-app-1' },
    update: {},
    create: {
      id: 'test-app-1',
      name: 'Test Application',
      description: 'Test application for demo',
      userId: user.id,
      githubRepo: 'Kpreya/vigilAI'
    }
  });

  console.log('Created application:', app.name);

  // Create an API key
  const apiKey = crypto.randomBytes(32).toString('hex');
  const keyPrefix = apiKey.substring(0, 8);
  const hashedApiKey = await bcrypt.hash(apiKey, 10);
  
  const key = await prisma.apiKey.upsert({
    where: { id: 'test-key-1' },
    update: {},
    create: {
      id: 'test-key-1',
      name: 'Test API Key',
      key: hashedApiKey,
      keyPrefix: keyPrefix,
      userId: user.id,
      applicationId: app.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  });

  console.log('Created API key:', key.name);
  console.log('\n===========================================');
  console.log('IMPORTANT: Save this API key (shown only once):');
  console.log('API Key:', apiKey);
  console.log('===========================================\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
