import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { en, ru } from '../src/i18n';
async function setup() {
  const dom = new JSDOM(
    '<!doctype html><html><body><h1 id="title"></h1><form id="form"><div id="fields"></div><p id="error"></p><button id="save" type="submit"></button><button id="cancel" type="button"></button></form></body></html>',
    { runScripts: 'outside-only' },
  );
  const messages: unknown[] = [];
  let state: unknown = {};
  Object.assign(dom.window, {
    acquireVsCodeApi: () => ({
      postMessage: (message: unknown) => messages.push(message),
      getState: () => state,
      setState: (value: unknown) => {
        state = value;
      },
    }),
  });
  dom.window.eval(await readFile('media/form.js', 'utf8'));
  const send = (data: unknown) =>
    dom.window.dispatchEvent(new dom.window.MessageEvent('message', { data }));
  send({
    type: 'init',
    readonly: false,
    fields: [
      { name: 'comment', label: 'comment', value: '', multiline: true },
      {
        name: 'severity',
        label: 'severity',
        value: 'minor',
        options: [{ value: 'minor', label: 'minor' }],
      },
    ],
  });
  send({ type: 'labels', labels: en, title: 'add', language: 'en' });
  return { dom, messages, send };
}
test('form language changes preserve entered text and severity', async () => {
  const { dom, send } = await setup();
  try {
    const input = dom.window.document.getElementById(
      'comment',
    ) as HTMLTextAreaElement;
    input.value = 'Проверить сумму <script>alert(1)</script>';
    input.dispatchEvent(new dom.window.Event('input'));
    send({ type: 'labels', labels: ru, title: 'add', language: 'ru' });
    assert.equal(input.value, 'Проверить сумму <script>alert(1)</script>');
    assert.equal(
      dom.window.document.querySelector('label')?.textContent,
      'Замечание',
    );
    assert.equal(dom.window.document.documentElement.lang, 'ru');
    assert.equal(dom.window.document.querySelectorAll('script').length, 0);
    assert.equal(
      dom.window.document.getElementById('severity-help')?.textContent,
      ru.minorHelp,
    );
  } finally {
    dom.window.close();
  }
});
test('form sends values and recovers from localized field validation', async () => {
  const { dom, messages, send } = await setup();
  try {
    const document = dom.window.document;
    document
      .getElementById('form')
      ?.dispatchEvent(new dom.window.Event('submit', { cancelable: true }));
    assert.equal(
      JSON.stringify(messages.at(-1)),
      JSON.stringify({
        type: 'save',
        values: { comment: '', severity: 'minor' },
      }),
    );
    assert.equal(
      (document.getElementById('save') as HTMLButtonElement).disabled,
      true,
    );
    send({ type: 'error', field: 'comment', key: 'required' });
    assert.equal(
      (document.getElementById('save') as HTMLButtonElement).disabled,
      false,
    );
    assert.equal(
      document.getElementById('comment')?.getAttribute('aria-invalid'),
      'true',
    );
    send({ type: 'labels', labels: ru, title: 'add', language: 'ru' });
    assert.equal(
      document.getElementById('comment-error')?.textContent,
      ru.required,
    );
  } finally {
    dom.window.close();
  }
});

test('review number defaults to one and survives a language change', async () => {
  const { dom, send } = await setup();
  try {
    send({
      type: 'init',
      readonly: false,
      fields: [
        { name: 'reviewNumber', label: 'number', value: '1', numeric: true },
      ],
    });
    const input = dom.window.document.getElementById(
      'reviewNumber',
    ) as HTMLInputElement;
    assert.equal(input.type, 'number');
    assert.equal(input.min, '1');
    assert.equal(input.value, '1');
    input.value = '7';
    send({ type: 'labels', labels: ru, title: 'start', language: 'ru' });
    assert.equal(input.value, '7');
    assert.equal(
      dom.window.document.querySelector('label[for=reviewNumber]')?.textContent,
      ru.number,
    );
  } finally {
    dom.window.close();
  }
});
