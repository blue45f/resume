module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.e2e-spec\\.ts$'],
  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.guard.ts',
    '!src/**/prisma.service.ts',
  ],
  coverageDirectory: './coverage',
};
