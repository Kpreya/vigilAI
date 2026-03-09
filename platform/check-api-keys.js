const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    const keys = await prisma.apiKey.findMany({
      include: {
        application: true,
        user: true
      }
    });
    
    console.log('\n=== API Keys in Database ===\n');
    keys.forEach(k => {
      console.log('ID:', k.id);
      console.log('Name:', k.name);
      console.log('Key (hashed):', k.key);
      console.log('User:', k.user?.email);
      console.log('Application:', k.application?.name || 'None (user-level key)');
      console.log('Expires:', k.expiresAt || 'Never');
      console.log('Revoked:', k.revokedAt || 'No');
      console.log('---');
    });
    
    // Check if our demo key hash matches
    const demoKey = 'vgl_0342b18df8f494ce517f357789c5693299f8df8ce3afd7990071a8dd0f7066a3';
    const demoHash = crypto.createHash('sha256').update(demoKey).digest('hex');
    
    console.log('\n=== Demo Key Check ===');
    console.log('Demo key:', demoKey);
    console.log('Demo hash:', demoHash);
    
    const matchingKey = keys.find(k => k.key === demoHash);
    if (matchingKey) {
      console.log('✓ Demo key found in database!');
      console.log('  Associated with user:', matchingKey.user?.email);
      console.log('  Associated with app:', matchingKey.application?.name || 'None');
    } else {
      console.log('✗ Demo key NOT found in database');
      console.log('  Available hashes:', keys.map(k => k.key));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkApiKeys();
