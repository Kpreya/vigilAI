const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keys = await prisma.apiKey.findMany();
  console.log('API Keys in database:', keys.length);
  keys.forEach(k => {
    console.log('- ID:', k.id);
    console.log('  Prefix:', k.keyPrefix);
    console.log('  Revoked:', k.revokedAt ? 'Yes' : 'No');
    console.log('  Hash:', k.key.substring(0, 20) + '...');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
