import {
  mkdir,
  readFile,
  writeFile,
  rename,
  unlink,
  open,
} from 'node:fs/promises';
import { join } from 'node:path';
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
    // Exclusive file creation also prevents writers in other VS Code windows.
    const lock = await open(join(this.directory, 'write.lock'), 'wx');
    try {
      const db = await this.read();
      const result = await change(db);
      databaseSchema.parse(db);
      const temporary = this.file + '.tmp';
      await writeFile(temporary, JSON.stringify(db, null, 2), { mode: 0o600 });
      await rename(temporary, this.file);
      return result;
    } finally {
      await lock.close();
      await unlink(join(this.directory, 'write.lock'));
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
