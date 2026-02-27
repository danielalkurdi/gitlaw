import { Command, Args, Flags } from '@oclif/core';
import { writeDocument } from '@gitlaw/core';
import type { DocumentMeta } from '@gitlaw/core';
import { join } from 'node:path';

export async function createNewDocument(baseDir: string, name: string, type: string): Promise<void> {
  const docDir = join(baseDir, name);
  const meta: DocumentMeta = {
    title: name,
    type: type as DocumentMeta['type'],
    parties: [],
    created: new Date().toISOString().split('T')[0],
    status: 'draft',
    sections: [{ id: 'main', file: 'sections/01-main.md' }],
  };
  const sections = new Map([
    ['sections/01-main.md', `## ${name}\n\nDocument content goes here.\n`],
  ]);
  await writeDocument(docDir, meta, sections);
}

export default class New extends Command {
  static override description = 'Create a new legal document';

  static override args = {
    name: Args.string({ description: 'Document name', required: true }),
  };

  static override flags = {
    type: Flags.string({
      description: 'Document type',
      options: ['contract', 'policy', 'brief'],
      default: 'contract',
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(New);
    await createNewDocument(process.cwd(), args.name, flags.type);
    this.log(`Created document: ${args.name}`);
  }
}
