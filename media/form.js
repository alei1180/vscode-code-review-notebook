(() => {
  const vscode = acquireVsCodeApi();
  const form = document.getElementById('form');
  const container = document.getElementById('fields');
  let labels = {},
    fields = [],
    title = '',
    readonly = false;
  function translate() {
    document.getElementById('title').textContent = labels[title];
    document.getElementById('save').textContent = labels.save;
    document.getElementById('cancel').textContent = labels.cancel;
    document.querySelectorAll('[data-label]').forEach((el) => {
      el.textContent = labels[el.dataset.label];
    });
    document.querySelectorAll('[data-error]').forEach((el) => {
      el.textContent = labels[el.dataset.error];
    });
    const severity = document.getElementById('severity');
    if (severity)
      document.getElementById('severity-help').textContent =
        labels[severity.value + 'Help'];
  }
  function values() {
    return Object.fromEntries(
      fields.map((f) => [f.name, document.getElementById(f.name).value]),
    );
  }
  window.addEventListener('message', ({ data }) => {
    if (data.type === 'init') {
      fields = data.fields;
      readonly = data.readonly;
      const saved = vscode.getState() || {};
      for (const field of fields) {
        const group = document.createElement('div');
        group.className = 'field';
        const label = document.createElement('label');
        label.htmlFor = field.name;
        label.dataset.label = field.label;
        group.append(label);
        const input = document.createElement(
          field.options ? 'select' : field.multiline ? 'textarea' : 'input',
        );
        input.id = field.name;
        input.name = field.name;
        if (field.options)
          for (const option of field.options) {
            const el = document.createElement('option');
            el.value = option.value;
            el.dataset.label = option.label;
            input.append(el);
          }
        input.value = saved[field.name] ?? field.value;
        if (input.tagName === 'SELECT')
          input.disabled = readonly || field.readonly;
        else {
          input.readOnly = readonly || field.readonly;
          input.maxLength = field.multiline ? 100000 : 4000;
        }
        if (field.multiline) input.rows = field.name === 'code' ? 12 : 7;
        input.addEventListener('input', () => {
          vscode.setState(values());
          translate();
        });
        group.append(input);
        const error = document.createElement('p');
        error.className = 'field-error';
        error.id = field.name + '-error';
        error.setAttribute('role', 'alert');
        group.append(error);
        input.setAttribute('aria-describedby', error.id);
        if (field.name === 'severity') {
          const help = document.createElement('p');
          help.id = 'severity-help';
          group.append(help);
          input.setAttribute('aria-describedby', error.id + ' severity-help');
        }
        container.append(group);
      }
      document.getElementById('save').hidden = readonly;
      translate();
    }
    if (data.type === 'labels') {
      labels = data.labels;
      title = data.title;
      document.documentElement.lang = data.language;
      translate();
    }
    if (data.type === 'error') {
      const el = document.getElementById(
        data.field ? data.field + '-error' : 'error',
      );
      el.dataset.error = data.key;
      translate();
      document.getElementById('save').disabled = false;
      document.getElementById('cancel').disabled = false;
      if (data.field) {
        const input = document.getElementById(data.field);
        input.setAttribute('aria-invalid', 'true');
        input.focus();
      }
    }
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (readonly) return;
    document.querySelectorAll('[data-error]').forEach((el) => {
      delete el.dataset.error;
      el.textContent = '';
    });
    document
      .querySelectorAll('[aria-invalid]')
      .forEach((el) => el.removeAttribute('aria-invalid'));
    document.getElementById('save').disabled = true;
    document.getElementById('cancel').disabled = true;
    vscode.postMessage({ type: 'save', values: values() });
  });
  document
    .getElementById('cancel')
    .addEventListener('click', () => vscode.postMessage({ type: 'cancel' }));
  vscode.postMessage({ type: 'ready' });
})();
