import type { Field } from './forms';
import { severities, type Note } from './model';
export function noteFields(note: Note): Field[] {
  const fields: Field[] = [
    {
      name: 'module',
      label: note.general ? 'optionalModule' : 'file',
      value: note.module ?? note.file,
    },
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
      value: note.severity ?? 'minor',
      options: severities.map((value) => ({ value, label: value })),
    },
  ];
  return note.general
    ? fields.filter((field) => field.name !== 'range')
    : fields;
}
