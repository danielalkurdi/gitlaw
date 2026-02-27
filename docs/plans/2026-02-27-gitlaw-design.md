# gitlaw Design Document

Git-based version control for legal documents.

## Overview

gitlaw wraps Git with legal-specific semantics — approval workflows, digital signatures, smart redlining, and compliance audit trails. It targets solo lawyers, legal teams, and open law/policy communities.

Built on Git (via isomorphic-git), not replacing it. TypeScript/Node.js monorepo.

## Architecture

Monorepo with three packages (pnpm workspaces + Turborepo):

- **@gitlaw/core** — Git operations, document parsing/conversion, clause-level diffing, workflows, signing, audit trail
- **@gitlaw/cli** — Oclif CLI wrapping core with legal commands
- **@gitlaw/web** — Next.js web app consuming core for visual collaboration

Core is the single source of truth. CLI and web are thin consumers.

```
gitlaw/
├── packages/
│   ├── core/
│   │   └── src/
│   │       ├── git/          # isomorphic-git wrapper
│   │       ├── documents/    # Parsing, conversion, canonical format
│   │       ├── diff/         # Clause-level / semantic diffing
│   │       ├── workflow/     # Approval chains, review states
│   │       ├── signing/      # Digital signatures & verification
│   │       ├── audit/        # Immutable audit trail
│   │       └── index.ts
│   ├── cli/
│   │   └── src/commands/     # Oclif commands
│   └── web/
│       └── src/
│           ├── app/          # Next.js app router
│           ├── components/   # Diff viewer, doc editor, approval panel
│           └── lib/          # Web-specific adapters
├── package.json              # Workspace root
├── turbo.json
└── tsconfig.base.json
```

## Document Model

Documents are stored in a canonical structured format — a directory per document:

```
contracts/
└── acme-nda-2026/
    ├── document.yaml       # Metadata + structure
    ├── sections/
    │   ├── 01-definitions.md
    │   ├── 02-obligations.md
    │   ├── 03-term.md
    │   └── 04-remedies.md
    └── .gitlaw             # Tracking metadata (signatures, audit refs)
```

### document.yaml

```yaml
title: "Non-Disclosure Agreement"
type: contract
parties:
  - name: "Acme Corp"
    role: disclosing
  - name: "Widget Inc"
    role: receiving
created: 2026-02-27
status: draft          # draft | review | approved | finalised | archived
sections:
  - id: definitions
    file: sections/01-definitions.md
  - id: obligations
    file: sections/02-obligations.md
  - id: term
    file: sections/03-term.md
  - id: remedies
    file: sections/04-remedies.md
```

### Section files

Plain Markdown with optional clause markers:

```markdown
## Definitions

{{clause:confidential-info}}
"Confidential Information" means any information disclosed by the
Disclosing Party that is marked as confidential or that reasonably
should be understood to be confidential.
{{/clause}}
```

`{{clause:id}}` markers enable clause-level diffing and clause library reuse. Optional — unmarked text is tracked at paragraph level.

### .gitlaw file

```yaml
signatures: []
audit_log_ref: "refs/notes/gitlaw-audit"
workflow_state:
  current_reviewers: []
  approvals: []
```

### Format conversion

```
Import:  .docx / .pdf / .md  →  parser  →  canonical (yaml + sections/)
Export:  canonical  →  renderer  →  .docx / .pdf / .md
```

Parsers/renderers are pluggable. MVP ships with Markdown passthrough and DOCX via mammoth (import) and docx (export).

## Smart Redlining & Diffing

Three levels of diffing:

1. **Clause-level** — compares `{{clause:id}}` blocks across versions
2. **Paragraph-level** — for unmarked text, LCS algorithm on paragraph boundaries
3. **Word-level** — within changed clauses/paragraphs, highlights specific word changes

### Structured diff output

```typescript
interface DocumentDiff {
  sections: SectionDiff[];
  summary: { added: number; removed: number; modified: number; moved: number };
}

interface SectionDiff {
  sectionId: string;
  changes: Change[];
}

interface Change {
  type: 'added' | 'removed' | 'modified' | 'moved';
  clauseId?: string;
  location: { paragraph: number; offset?: number };
  old?: string;
  new?: string;
  wordDiff?: WordChange[];
}
```

### Redline generation

```
gitlaw redline <base-ref> <compare-ref> [--format md|docx|html]
```

DOCX output uses Word's native revision markup.

## Approval Workflows & Signatures

### Workflow state machine

```
draft → review → approved → finalised → archived
         ↑          |
         └──────────┘  (rejected → back to review)
```

### Reviews

Stored as Git notes on `refs/notes/gitlaw-reviews`:

```yaml
type: review
document: contracts/acme-nda-2026
reviewer: alice
decision: approved
timestamp: 2026-02-27T14:30:00Z
comment: "Looks good"
commit: abc123
```

### Approval rules

Configurable in `.gitlaw/config.yaml`:

```yaml
workflows:
  default:
    review:
      min_approvals: 2
      required_reviewers: []
      allow_self_approval: false
    finalisation:
      requires_all_reviewers: true
      requires_signature: true
```

### Digital signatures

Uses Git's GPG/SSH signing infrastructure:

```yaml
- signer: "Alice Smith <alice@firm.com>"
  key_id: "SSH256:abc123..."
  timestamp: 2026-02-27T15:00:00Z
  commit: def456
  scope: full_document     # full_document | section:<id>
  method: ssh              # ssh | gpg
```

## Compliance & Audit Trail

Append-only audit log stored as Git notes on `refs/notes/gitlaw-audit`.

### Logged events

| Event | Data |
|-------|------|
| Document created | author, timestamp, initial parties |
| Section modified | author, timestamp, section ID, commit ref |
| Review requested | requester, reviewers, timestamp |
| Review decision | reviewer, decision, comment, timestamp |
| Status transition | old/new status, actor, timestamp |
| Signature added | signer, key ID, scope, timestamp |
| Document exported | actor, format, timestamp, content hash |
| Access (web) | user, action, timestamp |

### Audit entry structure

```typescript
interface AuditEntry {
  id: string;              // SHA-256 hash of entry content
  prev: string | null;     // previous entry hash (chain link)
  timestamp: string;
  actor: string;
  event: AuditEventType;
  document: string;
  commit: string;
  details: Record<string, unknown>;
}
```

Hash-chained — tamper with any entry and `gitlaw audit verify` detects the break.

### Compliance export

```
gitlaw audit export <document> --format json|csv --from <date> --to <date>
```

Produces: full audit chain with integrity proof, all signatures, version history with diffs, reviewer decisions.

## CLI Commands

```
gitlaw init [--template <type>]
gitlaw new <name> [--type contract|policy|brief]
gitlaw import <file> [--format docx|md|pdf]
gitlaw export <document> [--format docx|md|pdf]

gitlaw status
gitlaw diff <document> [base] [compare]
gitlaw redline <document> <base> <compare> [--format md|docx|html]

gitlaw review request <document> --reviewers <list>
gitlaw review approve <document> [--comment <msg>]
gitlaw review reject <document> --reason <msg>
gitlaw review status <document>

gitlaw sign <document> [--key <id>]
gitlaw verify <document>

gitlaw audit log <document>
gitlaw audit verify <document>
gitlaw audit export <document> --format json|csv

gitlaw clause list
gitlaw clause add <id> <file>
gitlaw clause use <clause-id> <document> <section>
gitlaw clause update <id>

gitlaw config set <key> <value>
```

No `gitlaw commit` or `gitlaw push` — regular git commands handle version control. gitlaw adds legal semantics on top.

## Web App (v1)

### Pages

- **Dashboard** — repos/documents list, status overview, pending reviews
- **Document viewer** — rendered document with section navigation, metadata sidebar
- **Diff/Redline viewer** — interactive side-by-side/inline diff, clause/paragraph/word granularity toggle
- **Review panel** — approve/reject with comments, approval progress
- **Audit trail** — timeline view with integrity verification

### Connectivity

- **Local mode** — `gitlaw serve` for a local repo
- **Remote mode** — GitHub/GitLab API integration

### Not in v1

- Real-time collaborative editing
- Custom auth system (defer to GitHub OAuth for remote mode)
- Document editing in web UI
- Clause library management in web UI
