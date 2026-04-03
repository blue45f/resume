module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.server.json' }],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist-server/'],
  collectCoverageFrom: [
    'server/**/*.service.ts',
    'server/**/*.guard.ts',
    '!server/**/prisma.service.ts',
  ],
  coverageDirectory: './coverage',
};
