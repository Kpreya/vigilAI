const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('Adding API key to database...');
  
  // The raw API key from the SDK
  const rawApiKey = 'vgl_0342b18df8f494ce517f357789c5693299f8df8ce3afd7990071a8dd0f7066a3';
  const keyPrefix = rawApiKey.substring(0, 8);
  
  // Hash it using SHA256 (same as the events API)
  const hashedApiKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');
  
  // Get the first user and application
  const user = await prisma.user.findFirst();
  const app = await prisma.application.findFirst();
  
  if (!user || !app) {
    console.error('No user or application found. Please seed the database first.');
    return;
  }
  
  // Create the API key
  const key = await prisma.apiKey.upsert({
    where: { id: 'demo-key-1' },
    update: {
      key: hashedApiKey,
      keyPrefix: keyPrefix,
    },
    create: {
      id: 'demo-key-1',
      name: 'Demo API Key',
      key: hashedApiKey,
      keyPrefix: keyPrefix,
      userId: user.id,
      applicationId: app.id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    }
  });

  console.log('✅ API key added successfully!');
  console.log('Key ID:', key.id);
  console.log('Key Prefix:', key.keyPrefix);
  console.log('Hash (SHA256):', hashedApiKey.substring(0, 20) + '...');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
