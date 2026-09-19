import type { Field } from './forms';
import { severities, type Note } from './model';
export function noteFields(note: Note): Field[] {
  return [
    { name: 'module', label: 'file', value: note.module ?? note.file },
    {
      name: 'range',
      label: 'range',
      value:
        note.start === note.end
          ? String(note.start)
          : `${note.start}–${note.end}`,
      readonly: true,
    },
    { name: 'comment', label: 'comment', value: note.comment, multiline: true },
    { name: 'source', label: 'source', value: note.source },
    {
      name: 'severity',
      label: 'severity',
      value: note.severity,
      options: severities.map((value) => ({ value, label: value })),
    },
  ];
}
