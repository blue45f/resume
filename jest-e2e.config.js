module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.e2e-spec.ts$',
  modulePathIgnorePatterns: ['<rootDir>/dist-server/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.server.json' }],
  },
  testEnvironment: 'node',
};
