import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export class ClauseLibrary {
  constructor(private dir: string) {}

  private validateId(id: string): void {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error(`Invalid clause ID: "${id}". Only alphanumeric characters, hyphens, and underscores are allowed.`);
    }
  }

  async add(id: string, content: string): Promise<void> {
    this.validateId(id);
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, `${id}.md`), content);
  }

  async get(id: string): Promise<string> {
    this.validateId(id);
    return readFile(join(this.dir, `${id}.md`), 'utf-8');
  }

  async list(): Promise<string[]> {
    try {
      const files = await readdir(this.dir);
      return files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
    } catch {
      return [];
    }
  }
}
