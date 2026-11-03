/**
 * Only the pure layers are covered here: the grid arithmetic that broke on a
 * 375 dp phone, the money conversions the wallet screens add up, and the status
 * labels every order screen reads. Nothing touches the navigator or the network.
 */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
