import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export class ClauseLibrary {
  constructor(private dir: string) {}

  async add(id: string, content: string): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await writeFile(join(this.dir, `${id}.md`), content);
  }

  async get(id: string): Promise<string> {
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
