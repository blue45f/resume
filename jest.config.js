module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'server',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.service.ts', '**/*.controller.ts'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^isomorphic-dompurify$': '<rootDir>/__mocks__/dompurify.ts',
  },
  forceExit: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.server.json',
    },
  },
};
