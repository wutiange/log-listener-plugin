module.exports = {
  projects: ['<rootDir>/packages/*/jest.config.js'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  watchPathIgnorePatterns: ['node_modules'],
  testPathIgnorePatterns: ['node_modules'],
};
