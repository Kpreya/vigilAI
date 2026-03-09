// Mock for next-auth/providers/google
module.exports = {
  default: jest.fn(() => ({
    id: 'google',
    name: 'Google',
    type: 'oauth',
  })),
};
