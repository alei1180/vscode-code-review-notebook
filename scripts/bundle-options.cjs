const path = require('node:path');
module.exports = {
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['vscode'],
  legalComments: 'eof',
  alias: {
    pdfkit: require.resolve('pdfkit'),
    'brotli/decompress.js': path.resolve('src/brotli.ts'),
  },
};
