import { Command, Args, Flags } from '@oclif/core';
import { readDocument } from '@gitlaw/core';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';

export default class ReviewReject extends Command {
  static override description = 'Reject a document review';

  static override args = {
    document: Args.string({ description: 'Document directory', required: true }),
  };

  static override flags = {
    reason: Flags.string({ description: 'Rejection reason', required: true }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ReviewReject);
    const docDir = join(process.cwd(), args.document);
    const doc = await readDocument(docDir);

    doc.meta.status = 'draft';
    doc.tracking.workflow_state.current_reviewers = [];
    doc.tracking.workflow_state.approvals = [];
    await writeFile(join(docDir, 'document.yaml'), yaml.dump(doc.meta));
    await writeFile(join(docDir, '.gitlaw'), yaml.dump(doc.tracking));

    this.log(`Rejected: ${flags.reason}`);
  }
}
