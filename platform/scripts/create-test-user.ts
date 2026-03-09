/**
 * Simple script to create a test user for testing the /api/auth/me endpoint
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  console.log('Creating test user...');

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' },
    });

    if (existing) {
      console.log('✅ Test user already exists');
      console.log('   Email: test@example.com');
      console.log('   Password: Test123!@#');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Test123!@#', 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
        emailVerified: new Date(),
      },
    });

    console.log('✅ Test user created successfully!');
    console.log('   Email: test@example.com');
    console.log('   Password: Test123!@#');
    console.log('   User ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
