import { Command, Args, Flags } from '@oclif/core';
import { readDocument } from '@gitlaw/core';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';

export default class ReviewRequest extends Command {
  static override description = 'Request review for a document';

  static override args = {
    document: Args.string({ description: 'Document directory', required: true }),
  };

  static override flags = {
    reviewers: Flags.string({ description: 'Comma-separated reviewer names', required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewRequest);
    const docDir = join(process.cwd(), args.document);
    const doc = await readDocument(docDir);

    const reviewers = flags.reviewers.split(',').map(r => r.trim());
    doc.tracking.workflow_state.current_reviewers = reviewers;
    doc.meta.status = 'review';
    await writeFile(join(docDir, 'document.yaml'), yaml.dump(doc.meta));
    await writeFile(join(docDir, '.gitlaw'), yaml.dump(doc.tracking));

    this.log(`Review requested from: ${reviewers.join(', ')}`);
  }
}
