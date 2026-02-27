import { Command, Args } from '@oclif/core';
import { ClauseLibrary } from '@gitlaw/core';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export default class ClauseAdd extends Command {
  static override description = 'Add a clause to the library';

  static override args = {
    id: Args.string({ description: 'Clause ID', required: true }),
    file: Args.string({ description: 'File containing clause content', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ClauseAdd);
    const content = await readFile(args.file, 'utf-8');
    const lib = new ClauseLibrary(join(process.cwd(), '.gitlaw', 'clauses'));
    await lib.add(args.id, content);
    this.log(`Added clause: ${args.id}`);
  }
}
