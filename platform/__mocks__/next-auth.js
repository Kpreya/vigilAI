// Mock for next-auth
const NextAuth = jest.fn();

module.exports = {
  default: NextAuth,
  NextAuth,
};

// Mock for next-auth/providers/credentials
module.exports.providers = {
  Credentials: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
  })),
  GitHub: jest.fn(() => ({
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
  })),
  Google: jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
};
