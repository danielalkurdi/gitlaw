import { Command, Args, Flags } from '@oclif/core';
import { readDocument, diffDocuments } from '@gitlaw/core';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export default class Redline extends Command {
  static override description = 'Generate a redline document comparing two versions';

  static override args = {
    document: Args.string({ description: 'Document path', required: true }),
    base: Args.string({ description: 'Base ref (directory path)', required: true }),
    compare: Args.string({ description: 'Compare ref (directory path)', required: true }),
  };

  static override flags = {
    format: Flags.string({ description: 'Output format', options: ['md', 'html'], default: 'md' }),
    output: Flags.string({ description: 'Output file', char: 'o' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Redline);
    const oldDoc = await readDocument(join(args.base, args.document));
    const newDoc = await readDocument(join(args.compare, args.document));
    const diff = diffDocuments(oldDoc, newDoc);

    let output = `# Redline: ${newDoc.meta.title}\n\n`;
    output += `**Changes:** +${diff.summary.added} added, -${diff.summary.removed} removed, ~${diff.summary.modified} modified\n\n---\n\n`;

    for (const section of diff.sections) {
      if (section.changes.length === 0) continue;
      output += `## ${section.sectionId}\n\n`;
      for (const change of section.changes) {
        if (change.old) output += `~~${change.old.trim()}~~\n\n`;
        if (change.new) output += `**${change.new.trim()}**\n\n`;
      }
    }

    if (flags.output) {
      await writeFile(flags.output, output);
      this.log(`Redline written to ${flags.output}`);
    } else {
      this.log(output);
    }
  }
}
