import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import { lock } from 'proper-lockfile';
import { databaseSchema, type Database } from './model';

export class Store {
  constructor(private readonly directory: string) {}
  private get file(): string {
    return join(this.directory, 'reviews.json');
  }
  async read(): Promise<Database> {
    try {
      return databaseSchema.parse(
        JSON.parse(await readFile(this.file, 'utf8')) as unknown,
      );
    } catch (error) {
      if (isCode(error, 'ENOENT'))
        return { version: 1, reviews: [], active: null };
      throw error;
    }
  }
  async transaction<T>(change: (db: Database) => Promise<T> | T): Promise<T> {
    await mkdir(this.directory, { recursive: true });
    let compromised = false;
    // Heartbeats distinguish a live writer from a crashed extension host.
    const release = await lock(this.file, {
      realpath: false,
      stale: 30000,
      update: 5000,
      retries: 0,
      onCompromised: () => {
        compromised = true;
      },
    });
    try {
      const db = await this.read();
      const result = await change(db);
      databaseSchema.parse(db);
      if (compromised) throw new Error('Storage lock lost');
      const temporary = this.file + '.tmp';
      await writeFile(temporary, JSON.stringify(db, null, 2), { mode: 0o600 });
      if (compromised) throw new Error('Storage lock lost');
      await rename(temporary, this.file);
      return result;
    } finally {
      if (!compromised) await release();
    }
  }
}
export function isCode(error: unknown, code: string): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === code
  );
}
