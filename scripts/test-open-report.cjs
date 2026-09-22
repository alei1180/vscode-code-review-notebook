const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const { EventEmitter } = require('node:events');
const { runInNewContext } = require('node:vm');

async function main() {
  const source = await readFile('out/src/open-report.js', 'utf8');
  for (const platform of ['win32', 'darwin']) {
    for (const failure of ['none', 'missing', 'launch', 'refused']) {
      const file =
        'C:\\Users\\Тест\\Code Review Note\\Задача & 100% #1\\report.pdf';
      const launches = [];
      let released = false;
      const exports = {};
      runInNewContext(source, {
        exports,
        process: { platform },
        require: (name) => {
          if (name === 'node:fs/promises')
            return {
              access: async (value) => {
                assert.equal(value, file);
                if (failure === 'missing') throw new Error('ENOENT');
              },
            };
          if (name === 'node:child_process')
            return {
              spawn: (command, args, options) => {
                launches.push({ command, args: [...args], options });
                const child = new EventEmitter();
                child.unref = () => {
                  released = true;
                };
                queueMicrotask(() =>
                  child.emit(
                    failure === 'launch' ? 'error' : 'spawn',
                    new Error('launch failed'),
                  ),
                );
                return child;
              },
            };
          if (name === 'vscode')
            return {
              Uri: { file: (value) => ({ fsPath: value }) },
              env: {
                openExternal: async (uri) => {
                  launches.push(uri);
                  assert.equal(uri.fsPath, file);
                  if (failure === 'launch') throw new Error('launch failed');
                  return failure !== 'refused';
                },
              },
            };
          throw new Error(name);
        },
      });
      if (failure === 'missing' || failure === 'launch') {
        await assert.rejects(exports.openReport(file));
      } else {
        assert.equal(
          await exports.openReport(file),
          platform === 'win32' || failure !== 'refused',
        );
      }
      if (failure === 'missing') assert.equal(launches.length, 0);
      else if (platform === 'win32') {
        assert.equal(launches[0].command, 'explorer.exe');
        assert.deepEqual(launches[0].args, [file]);
        assert.equal(launches[0].options.shell, false);
        assert.equal(released, failure !== 'launch');
      }
    }
  }
  console.log(
    'Report opening: Windows native paths, special characters, missing files and launcher failures passed.',
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
