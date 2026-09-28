import type { Database, Details } from './model';

/** Separate name histories, including reviews saved before history was introduced. */
export function peopleSuggestions(db: Database) {
  const names = (role: 'assignee' | 'reviewer') => [
    ...new Set(
      [
        ...(db.people?.[role] ?? []),
        ...db.reviews.map((review) => review.details[role]),
      ]
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ];
  return { assignee: names('assignee'), reviewer: names('reviewer') };
}

export function rememberPeople(db: Database, details: Details): void {
  const previous = peopleSuggestions(db);
  db.people = {
    assignee: [...new Set([details.assignee, ...previous.assignee])],
    reviewer: [...new Set([details.reviewer, ...previous.reviewer])],
  };
}
