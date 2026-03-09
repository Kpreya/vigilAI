const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function test() {
  const prisma = new PrismaClient();
  try {
    console.log('Testing Prisma connection...');
    const u = await prisma.user.findUnique({
      where: { email: 'admin@vigilai.com' }
    });
    console.log('User found:', u ? 'Yes' : 'No');
    
    if (u) {
      console.log('Testing bcrypt...');
      const isValid = await bcrypt.compare('TestPass123!', u.password);
      console.log('Password valid:', isValid);
    }
  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
}

test();
