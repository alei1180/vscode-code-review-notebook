const esbuild = require('esbuild');
const fs = require('node:fs/promises');
const path = require('node:path');
async function main() {
  const result = await esbuild.build({
    entryPoints: ['src/extension.ts'],
    ...require('./bundle-options.cjs'),
    outfile: 'dist/extension.cjs',
    sourcemap: true,
    metafile: true,
  });
  await fs.cp(
    path.join(path.dirname(require.resolve('pdfkit')), 'data'),
    'dist/data',
    { recursive: true },
  );
  const packages = new Map();
  for (const input of Object.keys(result.metafile.inputs)) {
    if (!input.includes('node_modules/')) continue;
    let directory = path.dirname(path.resolve(input));
    while (directory !== path.dirname(directory)) {
      try {
        const pkg = JSON.parse(
          await fs.readFile(path.join(directory, 'package.json'), 'utf8'),
        );
        if (pkg.name && pkg.version) {
          packages.set(pkg.name, { ...pkg, directory });
          break;
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      directory = path.dirname(directory);
    }
  }
  let notices =
    '# Third-party notices\n\nRuntime components included in the bundle. Complete license texts are in [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt).\n\n';
  let licenses = '';
  for (const pkg of [...packages.values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const names = (await fs.readdir(pkg.directory)).filter((name) =>
      /^(license|licence|copying|notice)(\.|$)/i.test(name),
    );
    if (!names.length) {
      if (pkg.license !== 'MIT')
        throw new Error('Missing license text: ' + pkg.name);
      const mit = (await fs.readFile('LICENSE', 'utf8')).split(
        'Permission is hereby granted',
      )[1];
      licenses += `\n${pkg.name} ${pkg.version}\nAuthor metadata: ${typeof pkg.author === 'string' ? pkg.author : JSON.stringify(pkg.author)}\nThis package declares MIT in package.json but ships no separate license file. The standard MIT permission text follows.\n\nPermission is hereby granted${mit}\n`;
    }
    notices += `- ${pkg.name} ${pkg.version} — ${typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license ?? pkg.licenses ?? 'See included license text')}\n`;
    for (const name of names)
      licenses +=
        `\n${'='.repeat(72)}\n${pkg.name} ${pkg.version} / ${name}\n${'='.repeat(72)}\n` +
        (await fs.readFile(path.join(pkg.directory, name), 'utf8')) +
        '\n';
  }
  notices +=
    '\nGNU FreeMono (20120503) is included under GPLv3+ with the font embedding exception; see [license](media/fonts/FreeMono-COPYING.txt) and [exception](media/fonts/FreeMono-README.txt). The corresponding original source archive is included at media/fonts/freefont-src-20120503.tar.gz. Upstream: https://www.gnu.org/software/freefont/. Noto Sans and Noto Sans Mono are included under the SIL Open Font License 1.1; see [font license](media/fonts/LICENSE.txt). The extension icon is original project artwork.\n';
  await fs.writeFile('THIRD_PARTY_NOTICES.md', notices);
  await fs.writeFile('THIRD_PARTY_LICENSES.txt', licenses);
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
