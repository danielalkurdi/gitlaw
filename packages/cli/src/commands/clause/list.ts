import { Command } from '@oclif/core';
import { ClauseLibrary } from '@gitlaw/core';
import { join } from 'node:path';

export default class ClauseList extends Command {
  static override description = 'List clauses in the clause library';

  async run(): Promise<void> {
    const lib = new ClauseLibrary(join(process.cwd(), '.gitlaw', 'clauses'));
    const clauses = await lib.list();
    if (clauses.length === 0) {
      this.log('No clauses in library.');
      return;
    }
    for (const id of clauses) {
      this.log(`  ${id}`);
    }
  }
}
