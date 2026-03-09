// Mock for next-auth/providers/github
module.exports = {
  default: jest.fn(() => ({
    id: 'github',
    name: 'GitHub',
    type: 'oauth',
  })),
};
