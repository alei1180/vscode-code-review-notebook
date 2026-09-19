const fs = require('node:fs');
for (const directory of ['out', 'dist']) {
  fs.rmSync(directory, { recursive: true, force: true });
}
