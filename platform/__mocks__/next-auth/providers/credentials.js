// Mock for next-auth/providers/credentials
module.exports = {
  default: jest.fn(() => ({
    id: 'credentials',
    name: 'Credentials',
    type: 'credentials',
  })),
};
