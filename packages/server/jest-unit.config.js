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
    '^.+\\.m?js$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'ecmascript' },
          target: 'es2022',
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  // sanitize-html 2.18+ 이 Node require(esm) 기반으로 htmlparser2@12 등 순수 ESM 패키지를 불러오므로
  // Jest 커스텀 런타임에서도 CommonJS 로 변환되도록 허용한다.
  transformIgnorePatterns: [
    '/node_modules/(?!(?:\\.pnpm/[^/]+/node_modules/)?(?:htmlparser2|domelementtype|domhandler|domutils|dom-serializer|entities|is-plain-object)/)',
  ],
  testEnvironment: 'node',
  // CI 안정화: 워커 메모리 누수로 인한 간헐적 SIGSEGV(@swc/jest 네이티브 워커)를
  // 방지하기 위해 워커 수를 제한하고 메모리 임계치에서 워커를 재생성한다.
  maxWorkers: '50%',
  workerIdleMemoryLimit: '512MB',
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '\\.e2e-spec\\.ts$'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: ['src/**/*.service.ts', 'src/**/*.guard.ts', '!src/**/prisma.service.ts'],
  coverageDirectory: './coverage',
}
