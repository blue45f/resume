module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.spec.ts$',
  transform: {
    // jest 30 호환 위해 @swc/jest 사용 (ts-jest 가 jest 30 미지원, latest 29.4.9).
    // swc 가 typescript + decorators 모두 지원하고 ts-jest 보다 ~10x 빠름.
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', decorators: true, dynamicImport: true },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true,
          },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
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
