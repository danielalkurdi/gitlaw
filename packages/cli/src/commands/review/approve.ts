import { Command, Args, Flags } from '@oclif/core';
import { readDocument } from '@gitlaw/core';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';

export default class ReviewApprove extends Command {
  static override description = 'Approve a document review';

  static override args = {
    document: Args.string({ description: 'Document directory', required: true }),
  };

  static override flags = {
    comment: Flags.string({ description: 'Review comment' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewApprove);
    const docDir = join(process.cwd(), args.document);
    const doc = await readDocument(docDir);

    const reviewer = process.env.USER ?? 'unknown';
    doc.tracking.workflow_state.approvals.push(reviewer);
    await writeFile(join(docDir, '.gitlaw'), yaml.dump(doc.tracking));

    this.log(`Approved by ${reviewer}${flags.comment ? `: ${flags.comment}` : ''}`);
  }
}
