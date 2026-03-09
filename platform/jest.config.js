const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^next-auth$': '<rootDir>/__mocks__/next-auth.js',
    '^next-auth/providers/credentials$': '<rootDir>/__mocks__/next-auth/providers/credentials.js',
    '^next-auth/providers/github$': '<rootDir>/__mocks__/next-auth/providers/github.js',
    '^next-auth/providers/google$': '<rootDir>/__mocks__/next-auth/providers/google.js',
    '^@auth/prisma-adapter$': '<rootDir>/__mocks__/@auth/prisma-adapter.js',
    '^@prisma/client$': '<rootDir>/__mocks__/@prisma/client.js',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
