import { build } from 'esbuild'

await build({
  entryPoints: ['src/index.ts'],
  outfile: 'lib/index.js',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
  external: ['node:*', '@deepseek-ai/schemastery'],
})

await build({
  entryPoints: ['src/client-core.ts', 'src/theme.ts'],
  outdir: 'lib',
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node22',
})

await build({
  entryPoints: ['src/client.ts'],
  outfile: 'lib/client.js',
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  external: ['react'],
  banner: {
    js: 'window.__ModuleLoader__.load({ id: "dsh-extra-body", factory: (require) => {\nvar module = { exports: {} }; var exports = module.exports;',
  },
  footer: { js: 'return module.exports; } });' },
})
