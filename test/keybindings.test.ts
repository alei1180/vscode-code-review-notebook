import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('all context-menu commands have scoped chords without ambiguous prefixes', async () => {
  const manifest = JSON.parse(await readFile('package.json', 'utf8')) as {
    contributes: {
      menus: Record<string, { command: string }[]>;
      keybindings: {
        command: string;
        key: string;
        mac: string;
        when: string;
        args?: { fromReviewTree: boolean };
      }[];
    };
  };
  const bindings = manifest.contributes.keybindings;
  for (const menu of [
    'codeReviewNotes.editorMenu',
    'codeReviewNotes.itemMenu',
  ]) {
    for (const item of manifest.contributes.menus[menu]!) {
      assert.ok(bindings.some((binding) => binding.command === item.command));
    }
  }
  for (const binding of bindings) {
    assert.match(binding.key, /^ctrl\+alt\+shift\+r \w+$/);
    assert.match(binding.mac, /^cmd\+alt\+shift\+r \w+$/);
    assert.match(binding.when, /isWorkspaceTrusted/);
    assert.match(
      binding.when,
      /editorTextFocus.*resourceScheme == file|focusedView == codeReviewNotes.reviews.*listFocus.*!inputFocus/,
    );
    if (binding.args?.fromReviewTree)
      assert.match(binding.when, /focusedView == codeReviewNotes.reviews/);
  }
  for (const platform of ['key', 'mac'] as const) {
    for (const binding of bindings) {
      const sameKey = bindings.filter(
        (other) => other[platform] === binding[platform],
      );
      assert.equal(new Set(sameKey.map((other) => other.command)).size, 1);
      assert.equal(
        new Set(sameKey.map((other) => other.when)).size,
        sameKey.length,
      );
      assert.ok(
        !bindings.some((other) =>
          other[platform].startsWith(binding[platform] + ' '),
        ),
      );
    }
  }
});
