import { Command, Args } from '@oclif/core';
import { readDocument, diffDocuments } from '@gitlaw/core';
import { join } from 'node:path';

export default class Diff extends Command {
  static override description = 'Show semantic diff of a document between versions';

  static override args = {
    document: Args.string({ description: 'Document path', required: true }),
    base: Args.string({ description: 'Base ref (directory path)', required: true }),
    compare: Args.string({ description: 'Compare ref (directory path)', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(Diff);
    const oldDoc = await readDocument(join(args.base, args.document));
    const newDoc = await readDocument(join(args.compare, args.document));
    const diff = diffDocuments(oldDoc, newDoc);

    this.log(`Summary: +${diff.summary.added} -${diff.summary.removed} ~${diff.summary.modified}`);
    for (const section of diff.sections) {
      if (section.changes.length === 0) continue;
      this.log(`\n--- ${section.sectionId} ---`);
      for (const change of section.changes) {
        const prefix = change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~';
        const label = change.clauseId ? `[clause:${change.clauseId}]` : `[para:${change.location.paragraph}]`;
        this.log(`  ${prefix} ${label}`);
        if (change.old) this.log(`    - ${change.old.substring(0, 80)}`);
        if (change.new) this.log(`    + ${change.new.substring(0, 80)}`);
      }
    }
  }
}
