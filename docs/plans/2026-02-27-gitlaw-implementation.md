# gitlaw Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a Git-based version control system for legal documents with smart redlining, approval workflows, digital signatures, and compliance audit trails.

**Architecture:** TypeScript monorepo with three packages — @gitlaw/core (engine), @gitlaw/cli (Oclif CLI), @gitlaw/web (Next.js). Core wraps Git via isomorphic-git. Documents stored as YAML metadata + Markdown sections with optional clause markers. Reviews, signatures, and audit entries stored as Git notes.

**Tech Stack:** TypeScript, pnpm workspaces, Turborepo, isomorphic-git, Oclif, Next.js, Vitest, mammoth (DOCX import), docx (DOCX export), js-yaml

**Security notes:**
- CLI test files use `execFileSync` (not `exec`) to avoid shell injection
- Web components rendering user-generated HTML must sanitize with DOMPurify before rendering

---

## Phase 1: Monorepo Scaffolding

### Task 1: Initialize pnpm workspace and root config

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.npmrc`

**Step 1: Create root package.json**

```json
{
  "name": "gitlaw",
  "private": true,
  "scripts": {
    "build": "turbo build",
    "test": "turbo test",
    "lint": "turbo lint",
    "clean": "turbo clean"
  },
  "devDependencies": {
    "turbo": "^2",
    "typescript": "^5"
  },
  "packageManager": "pnpm@9.15.4"
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {},
    "clean": {
      "cache": false
    }
  }
}
```

**Step 4: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
.turbo/
*.tsbuildinfo
```

**Step 6: Create .npmrc**

```ini
auto-install-peers=true
```

**Step 7: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, turbo and typescript installed

**Step 8: Commit**

```bash
git add -A
git commit -m "chore: initialize pnpm workspace with turborepo"
```

---

### Task 2: Scaffold @gitlaw/core package

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/vitest.config.ts`
- Create: `packages/core/src/index.ts`

**Step 1: Create packages/core/package.json**

```json
{
  "name": "@gitlaw/core",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "isomorphic-git": "^1",
    "js-yaml": "^4",
    "mammoth": "^1",
    "docx": "^9"
  },
  "devDependencies": {
    "vitest": "^3",
    "@types/js-yaml": "^4",
    "typescript": "^5"
  }
}
```

**Step 2: Create packages/core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 3: Create packages/core/vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

**Step 4: Create packages/core/src/index.ts**

```typescript
export const VERSION = '0.1.0';
```

**Step 5: Install and verify build**

Run: `pnpm install && pnpm --filter @gitlaw/core build`
Expected: `dist/index.js` and `dist/index.d.ts` created

**Step 6: Write a smoke test**

Create `packages/core/src/__tests__/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { VERSION } from '../index.js';

describe('core', () => {
  it('exports version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
```

**Step 7: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: 1 test passes

**Step 8: Commit**

```bash
git add packages/core/
git commit -m "chore: scaffold @gitlaw/core package"
```

---

### Task 3: Scaffold @gitlaw/cli package

**Files:**
- Create: `packages/cli/package.json`
- Create: `packages/cli/tsconfig.json`
- Create: `packages/cli/bin/run.ts`
- Create: `packages/cli/src/index.ts`

**Step 1: Create packages/cli/package.json**

```json
{
  "name": "@gitlaw/cli",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "gitlaw": "./bin/run.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@gitlaw/core": "workspace:*",
    "@oclif/core": "^4"
  },
  "devDependencies": {
    "vitest": "^3",
    "typescript": "^5"
  },
  "oclif": {
    "bin": "gitlaw",
    "dirname": "gitlaw",
    "commands": "./dist/commands",
    "topicSeparator": " "
  }
}
```

**Step 2: Create packages/cli/tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

**Step 3: Create packages/cli/bin/run.ts**

```typescript
#!/usr/bin/env node
import { execute } from '@oclif/core';
await execute({ dir: import.meta.url });
```

**Step 4: Create packages/cli/src/index.ts**

```typescript
export { run } from '@oclif/core';
```

**Step 5: Install and verify build**

Run: `pnpm install && pnpm --filter @gitlaw/cli build`
Expected: builds without errors

**Step 6: Commit**

```bash
git add packages/cli/
git commit -m "chore: scaffold @gitlaw/cli package"
```

---

## Phase 2: Document Model (@gitlaw/core)

### Task 4: Document types and schema validation

**Files:**
- Create: `packages/core/src/documents/types.ts`
- Create: `packages/core/src/documents/schema.ts`
- Test: `packages/core/src/__tests__/documents/schema.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/documents/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { validateDocumentMeta, DocumentMeta } from '../../documents/schema.js';

describe('validateDocumentMeta', () => {
  it('accepts a valid document metadata object', () => {
    const meta: DocumentMeta = {
      title: 'Non-Disclosure Agreement',
      type: 'contract',
      parties: [
        { name: 'Acme Corp', role: 'disclosing' },
        { name: 'Widget Inc', role: 'receiving' },
      ],
      created: '2026-02-27',
      status: 'draft',
      sections: [
        { id: 'definitions', file: 'sections/01-definitions.md' },
      ],
    };
    const result = validateDocumentMeta(meta);
    expect(result.valid).toBe(true);
  });

  it('rejects missing title', () => {
    const meta = { type: 'contract', parties: [], created: '2026-02-27', status: 'draft', sections: [] };
    const result = validateDocumentMeta(meta as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('title is required');
  });

  it('rejects invalid status', () => {
    const meta = {
      title: 'Test',
      type: 'contract',
      parties: [],
      created: '2026-02-27',
      status: 'invalid',
      sections: [],
    };
    const result = validateDocumentMeta(meta as any);
    expect(result.valid).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL — cannot resolve module

**Step 3: Create types**

Create `packages/core/src/documents/types.ts`:

```typescript
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'finalised' | 'archived';
export type DocumentType = 'contract' | 'policy' | 'brief';

export interface Party {
  name: string;
  role: string;
}

export interface SectionRef {
  id: string;
  file: string;
}

export interface DocumentMeta {
  title: string;
  type: DocumentType;
  parties: Party[];
  created: string;
  status: DocumentStatus;
  sections: SectionRef[];
}

export interface GitlawTracking {
  signatures: Signature[];
  audit_log_ref: string;
  workflow_state: WorkflowState;
}

export interface Signature {
  signer: string;
  key_id: string;
  timestamp: string;
  commit: string;
  scope: string;
  method: 'ssh' | 'gpg';
}

export interface WorkflowState {
  current_reviewers: string[];
  approvals: string[];
}
```

**Step 4: Implement schema validation**

Create `packages/core/src/documents/schema.ts`:

```typescript
import type { DocumentMeta, DocumentStatus } from './types.js';
export type { DocumentMeta } from './types.js';

const VALID_STATUSES: DocumentStatus[] = ['draft', 'review', 'approved', 'finalised', 'archived'];
const VALID_TYPES = ['contract', 'policy', 'brief'];

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDocumentMeta(meta: unknown): ValidationResult {
  const errors: string[] = [];
  const obj = meta as Record<string, unknown>;

  if (!obj || typeof obj !== 'object') {
    return { valid: false, errors: ['input must be an object'] };
  }
  if (typeof obj.title !== 'string' || !obj.title) {
    errors.push('title is required');
  }
  if (!VALID_TYPES.includes(obj.type as string)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (!Array.isArray(obj.parties)) {
    errors.push('parties must be an array');
  }
  if (typeof obj.created !== 'string' || !obj.created) {
    errors.push('created is required');
  }
  if (!VALID_STATUSES.includes(obj.status as DocumentStatus)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }
  if (!Array.isArray(obj.sections)) {
    errors.push('sections must be an array');
  }

  return { valid: errors.length === 0, errors };
}
```

**Step 5: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: 3 tests pass

**Step 6: Commit**

```bash
git add packages/core/src/documents/ packages/core/src/__tests__/documents/
git commit -m "feat(core): add document types and schema validation"
```

---

### Task 5: Clause parser — extract clause markers from Markdown sections

**Files:**
- Create: `packages/core/src/documents/clause-parser.ts`
- Test: `packages/core/src/__tests__/documents/clause-parser.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/documents/clause-parser.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { parseClauses, type ParsedSection } from '../../documents/clause-parser.js';

describe('parseClauses', () => {
  it('extracts a single clause', () => {
    const md = `## Definitions

{{clause:confidential-info}}
"Confidential Information" means any information disclosed.
{{/clause}}
`;
    const result = parseClauses(md);
    expect(result.clauses).toHaveLength(1);
    expect(result.clauses[0].id).toBe('confidential-info');
    expect(result.clauses[0].content.trim()).toBe(
      '"Confidential Information" means any information disclosed.'
    );
  });

  it('extracts multiple clauses', () => {
    const md = `{{clause:a}}
First clause.
{{/clause}}

Some unmarked text.

{{clause:b}}
Second clause.
{{/clause}}`;
    const result = parseClauses(md);
    expect(result.clauses).toHaveLength(2);
    expect(result.paragraphs).toHaveLength(1);
    expect(result.paragraphs[0].content.trim()).toBe('Some unmarked text.');
  });

  it('handles text with no clauses', () => {
    const md = `Just a plain paragraph.

Another paragraph.`;
    const result = parseClauses(md);
    expect(result.clauses).toHaveLength(0);
    expect(result.paragraphs).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement clause parser**

Create `packages/core/src/documents/clause-parser.ts`:

```typescript
export interface ClauseBlock {
  id: string;
  content: string;
  startLine: number;
}

export interface ParagraphBlock {
  content: string;
  startLine: number;
}

export interface ParsedSection {
  clauses: ClauseBlock[];
  paragraphs: ParagraphBlock[];
}

const CLAUSE_OPEN = /^\{\{clause:([a-zA-Z0-9_-]+)\}\}\s*$/;
const CLAUSE_CLOSE = /^\{\{\/clause\}\}\s*$/;

export function parseClauses(markdown: string): ParsedSection {
  const lines = markdown.split('\n');
  const clauses: ClauseBlock[] = [];
  const paragraphs: ParagraphBlock[] = [];

  let inClause = false;
  let currentClauseId = '';
  let currentClauseLines: string[] = [];
  let clauseStartLine = 0;

  let unmarkedLines: string[] = [];
  let unmarkedStartLine = 0;

  function flushUnmarked() {
    const text = unmarkedLines.join('\n').trim();
    if (text) {
      paragraphs.push({ content: text, startLine: unmarkedStartLine });
    }
    unmarkedLines = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!inClause) {
      const openMatch = line.match(CLAUSE_OPEN);
      if (openMatch) {
        flushUnmarked();
        inClause = true;
        currentClauseId = openMatch[1];
        currentClauseLines = [];
        clauseStartLine = i;
        continue;
      }

      if (unmarkedLines.length === 0) {
        unmarkedStartLine = i;
      }
      unmarkedLines.push(line);
    } else {
      if (CLAUSE_CLOSE.test(line)) {
        clauses.push({
          id: currentClauseId,
          content: currentClauseLines.join('\n'),
          startLine: clauseStartLine,
        });
        inClause = false;
        continue;
      }
      currentClauseLines.push(line);
    }
  }

  flushUnmarked();
  return { clauses, paragraphs };
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Commit**

```bash
git add packages/core/src/documents/clause-parser.ts packages/core/src/__tests__/documents/clause-parser.test.ts
git commit -m "feat(core): add clause marker parser for markdown sections"
```

---

### Task 6: Document reader — load canonical format from disk

**Files:**
- Create: `packages/core/src/documents/reader.ts`
- Test: `packages/core/src/__tests__/documents/reader.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/documents/reader.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { readDocument } from '../../documents/reader.js';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('readDocument', () => {
  let docDir: string;

  beforeEach(async () => {
    docDir = await mkdtemp(join(tmpdir(), 'gitlaw-test-'));
    await mkdir(join(docDir, 'sections'), { recursive: true });

    await writeFile(join(docDir, 'document.yaml'), `
title: "Test NDA"
type: contract
parties:
  - name: "Acme"
    role: disclosing
created: "2026-02-27"
status: draft
sections:
  - id: definitions
    file: sections/01-definitions.md
`);

    await writeFile(join(docDir, 'sections', '01-definitions.md'), `## Definitions

{{clause:confidential-info}}
Confidential info means secret stuff.
{{/clause}}
`);

    await writeFile(join(docDir, '.gitlaw'), `
signatures: []
audit_log_ref: "refs/notes/gitlaw-audit"
workflow_state:
  current_reviewers: []
  approvals: []
`);
  });

  it('reads document metadata', async () => {
    const doc = await readDocument(docDir);
    expect(doc.meta.title).toBe('Test NDA');
    expect(doc.meta.status).toBe('draft');
  });

  it('reads and parses sections', async () => {
    const doc = await readDocument(docDir);
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0].id).toBe('definitions');
    expect(doc.sections[0].parsed.clauses).toHaveLength(1);
  });

  it('reads gitlaw tracking file', async () => {
    const doc = await readDocument(docDir);
    expect(doc.tracking.audit_log_ref).toBe('refs/notes/gitlaw-audit');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement document reader**

Create `packages/core/src/documents/reader.ts`:

```typescript
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import yaml from 'js-yaml';
import type { DocumentMeta, GitlawTracking } from './types.js';
import { parseClauses, type ParsedSection } from './clause-parser.js';

export interface LoadedSection {
  id: string;
  file: string;
  raw: string;
  parsed: ParsedSection;
}

export interface LoadedDocument {
  path: string;
  meta: DocumentMeta;
  sections: LoadedSection[];
  tracking: GitlawTracking;
}

export async function readDocument(docDir: string): Promise<LoadedDocument> {
  const metaRaw = await readFile(join(docDir, 'document.yaml'), 'utf-8');
  const meta = yaml.load(metaRaw) as DocumentMeta;

  const trackingRaw = await readFile(join(docDir, '.gitlaw'), 'utf-8');
  const tracking = yaml.load(trackingRaw) as GitlawTracking;

  const sections: LoadedSection[] = [];
  for (const ref of meta.sections) {
    const raw = await readFile(join(docDir, ref.file), 'utf-8');
    const parsed = parseClauses(raw);
    sections.push({ id: ref.id, file: ref.file, raw, parsed });
  }

  return { path: docDir, meta, sections, tracking };
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Commit**

```bash
git add packages/core/src/documents/reader.ts packages/core/src/__tests__/documents/reader.test.ts
git commit -m "feat(core): add document reader for canonical format"
```

---

### Task 7: Document writer — create canonical format on disk

**Files:**
- Create: `packages/core/src/documents/writer.ts`
- Test: `packages/core/src/__tests__/documents/writer.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/documents/writer.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { writeDocument } from '../../documents/writer.js';
import { readDocument } from '../../documents/reader.js';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { DocumentMeta } from '../../documents/types.js';

describe('writeDocument', () => {
  it('writes and round-trips a document', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gitlaw-write-'));
    const docDir = join(dir, 'test-doc');

    const meta: DocumentMeta = {
      title: 'Test Agreement',
      type: 'contract',
      parties: [{ name: 'Alice', role: 'party-a' }],
      created: '2026-02-27',
      status: 'draft',
      sections: [{ id: 'intro', file: 'sections/01-intro.md' }],
    };

    const sectionContents = new Map([
      ['sections/01-intro.md', '## Introduction\n\nThis is the intro.\n'],
    ]);

    await writeDocument(docDir, meta, sectionContents);

    const loaded = await readDocument(docDir);
    expect(loaded.meta.title).toBe('Test Agreement');
    expect(loaded.sections[0].raw).toContain('This is the intro.');
    expect(loaded.tracking.signatures).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement document writer**

Create `packages/core/src/documents/writer.ts`:

```typescript
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import yaml from 'js-yaml';
import type { DocumentMeta, GitlawTracking } from './types.js';

export async function writeDocument(
  docDir: string,
  meta: DocumentMeta,
  sectionContents: Map<string, string>,
): Promise<void> {
  await mkdir(docDir, { recursive: true });

  await writeFile(join(docDir, 'document.yaml'), yaml.dump(meta));

  for (const [relPath, content] of sectionContents) {
    const fullPath = join(docDir, relPath);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content);
  }

  const tracking: GitlawTracking = {
    signatures: [],
    audit_log_ref: 'refs/notes/gitlaw-audit',
    workflow_state: {
      current_reviewers: [],
      approvals: [],
    },
  };
  await writeFile(join(docDir, '.gitlaw'), yaml.dump(tracking));
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Commit**

```bash
git add packages/core/src/documents/writer.ts packages/core/src/__tests__/documents/writer.test.ts
git commit -m "feat(core): add document writer for canonical format"
```

---

## Phase 3: Diffing Engine (@gitlaw/core)

### Task 8: Word-level diff

**Files:**
- Create: `packages/core/src/diff/word-diff.ts`
- Test: `packages/core/src/__tests__/diff/word-diff.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/diff/word-diff.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { wordDiff, type WordChange } from '../../diff/word-diff.js';

describe('wordDiff', () => {
  it('detects no changes for identical text', () => {
    const result = wordDiff('hello world', 'hello world');
    expect(result).toEqual([{ type: 'equal', value: 'hello world' }]);
  });

  it('detects word additions', () => {
    const result = wordDiff('hello world', 'hello beautiful world');
    expect(result).toContainEqual({ type: 'added', value: 'beautiful' });
  });

  it('detects word removals', () => {
    const result = wordDiff('hello beautiful world', 'hello world');
    expect(result).toContainEqual({ type: 'removed', value: 'beautiful' });
  });

  it('detects word modifications', () => {
    const result = wordDiff('the quick fox', 'the slow fox');
    expect(result).toContainEqual({ type: 'removed', value: 'quick' });
    expect(result).toContainEqual({ type: 'added', value: 'slow' });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement word-level diff using LCS**

Create `packages/core/src/diff/word-diff.ts`:

```typescript
export interface WordChange {
  type: 'equal' | 'added' | 'removed';
  value: string;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter(t => t.length > 0);
}

function lcs(a: string[], b: string[]): boolean[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const inLcs: boolean[][] = [Array(m).fill(false), Array(n).fill(false)];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      inLcs[0][i - 1] = true;
      inLcs[1][j - 1] = true;
      i--; j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }
  return inLcs;
}

export function wordDiff(oldText: string, newText: string): WordChange[] {
  const oldTokens = tokenize(oldText);
  const newTokens = tokenize(newText);
  const [oldInLcs, newInLcs] = lcs(oldTokens, newTokens);

  const changes: WordChange[] = [];
  let oi = 0, ni = 0;

  while (oi < oldTokens.length || ni < newTokens.length) {
    if (oi < oldTokens.length && oldInLcs[oi] && ni < newTokens.length && newInLcs[ni]) {
      changes.push({ type: 'equal', value: oldTokens[oi] });
      oi++; ni++;
    } else {
      if (oi < oldTokens.length && !oldInLcs[oi]) {
        changes.push({ type: 'removed', value: oldTokens[oi] });
        oi++;
      } else if (ni < newTokens.length && !newInLcs[ni]) {
        changes.push({ type: 'added', value: newTokens[ni] });
        ni++;
      }
    }
  }

  // Merge consecutive equal tokens
  const merged: WordChange[] = [];
  for (const c of changes) {
    const last = merged[merged.length - 1];
    if (last && last.type === c.type && c.type === 'equal') {
      last.value += c.value;
    } else {
      merged.push({ ...c });
    }
  }

  return merged;
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Commit**

```bash
git add packages/core/src/diff/ packages/core/src/__tests__/diff/
git commit -m "feat(core): add word-level diff engine"
```

---

### Task 9: Clause-level and paragraph-level diff

**Files:**
- Create: `packages/core/src/diff/document-diff.ts`
- Create: `packages/core/src/diff/types.ts`
- Test: `packages/core/src/__tests__/diff/document-diff.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/diff/document-diff.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { diffSections } from '../../diff/document-diff.js';
import { parseClauses } from '../../documents/clause-parser.js';

describe('diffSections', () => {
  it('detects a modified clause', () => {
    const oldParsed = parseClauses(`{{clause:a}}
Old text here.
{{/clause}}`);
    const newParsed = parseClauses(`{{clause:a}}
New text here.
{{/clause}}`);

    const diff = diffSections(oldParsed, newParsed);
    expect(diff.changes).toHaveLength(1);
    expect(diff.changes[0].type).toBe('modified');
    expect(diff.changes[0].clauseId).toBe('a');
  });

  it('detects an added clause', () => {
    const oldParsed = parseClauses('Just text.');
    const newParsed = parseClauses(`Just text.

{{clause:new-clause}}
Brand new.
{{/clause}}`);

    const diff = diffSections(oldParsed, newParsed);
    const added = diff.changes.filter(c => c.type === 'added');
    expect(added).toHaveLength(1);
    expect(added[0].clauseId).toBe('new-clause');
  });

  it('detects a removed clause', () => {
    const oldParsed = parseClauses(`{{clause:gone}}
Old clause.
{{/clause}}`);
    const newParsed = parseClauses('');

    const diff = diffSections(oldParsed, newParsed);
    const removed = diff.changes.filter(c => c.type === 'removed');
    expect(removed).toHaveLength(1);
    expect(removed[0].clauseId).toBe('gone');
  });

  it('detects paragraph changes in unmarked text', () => {
    const oldParsed = parseClauses('Paragraph one.\n\nParagraph two.');
    const newParsed = parseClauses('Paragraph one.\n\nParagraph changed.');

    const diff = diffSections(oldParsed, newParsed);
    expect(diff.changes.length).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Create diff types**

Create `packages/core/src/diff/types.ts`:

```typescript
import type { WordChange } from './word-diff.js';

export interface Change {
  type: 'added' | 'removed' | 'modified' | 'moved';
  clauseId?: string;
  location: { paragraph: number; offset?: number };
  old?: string;
  new?: string;
  wordDiff?: WordChange[];
}

export interface SectionDiff {
  sectionId?: string;
  changes: Change[];
}

export interface DocumentDiff {
  sections: SectionDiff[];
  summary: { added: number; removed: number; modified: number; moved: number };
}
```

**Step 4: Implement section-level diff**

Create `packages/core/src/diff/document-diff.ts`:

```typescript
import type { ParsedSection } from '../documents/clause-parser.js';
import type { Change, SectionDiff } from './types.js';
import { wordDiff } from './word-diff.js';

export function diffSections(oldParsed: ParsedSection, newParsed: ParsedSection): SectionDiff {
  const changes: Change[] = [];

  // Index clauses by ID
  const oldClauseMap = new Map(oldParsed.clauses.map(c => [c.id, c]));
  const newClauseMap = new Map(newParsed.clauses.map(c => [c.id, c]));

  // Removed clauses
  for (const [id, clause] of oldClauseMap) {
    if (!newClauseMap.has(id)) {
      changes.push({
        type: 'removed',
        clauseId: id,
        location: { paragraph: clause.startLine },
        old: clause.content,
      });
    }
  }

  // Added clauses
  for (const [id, clause] of newClauseMap) {
    if (!oldClauseMap.has(id)) {
      changes.push({
        type: 'added',
        clauseId: id,
        location: { paragraph: clause.startLine },
        new: clause.content,
      });
    }
  }

  // Modified clauses
  for (const [id, newClause] of newClauseMap) {
    const oldClause = oldClauseMap.get(id);
    if (oldClause && oldClause.content !== newClause.content) {
      changes.push({
        type: 'modified',
        clauseId: id,
        location: { paragraph: newClause.startLine },
        old: oldClause.content,
        new: newClause.content,
        wordDiff: wordDiff(oldClause.content, newClause.content),
      });
    }
  }

  // Paragraph-level diff for unmarked text
  const maxLen = Math.max(oldParsed.paragraphs.length, newParsed.paragraphs.length);
  for (let i = 0; i < maxLen; i++) {
    const oldP = oldParsed.paragraphs[i];
    const newP = newParsed.paragraphs[i];

    if (!oldP && newP) {
      changes.push({ type: 'added', location: { paragraph: newP.startLine }, new: newP.content });
    } else if (oldP && !newP) {
      changes.push({ type: 'removed', location: { paragraph: oldP.startLine }, old: oldP.content });
    } else if (oldP && newP && oldP.content !== newP.content) {
      changes.push({
        type: 'modified',
        location: { paragraph: newP.startLine },
        old: oldP.content,
        new: newP.content,
        wordDiff: wordDiff(oldP.content, newP.content),
      });
    }
  }

  return { changes };
}
```

**Step 5: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 6: Commit**

```bash
git add packages/core/src/diff/ packages/core/src/__tests__/diff/
git commit -m "feat(core): add clause-level and paragraph-level diffing"
```

---

### Task 10: Full document diff — compare two LoadedDocuments

**Files:**
- Create: `packages/core/src/diff/index.ts`
- Test: `packages/core/src/__tests__/diff/index.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/diff/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { diffDocuments } from '../../diff/index.js';
import type { LoadedDocument } from '../../documents/reader.js';
import { parseClauses } from '../../documents/clause-parser.js';

function makeDoc(sections: { id: string; raw: string }[]): LoadedDocument {
  return {
    path: '/test',
    meta: { title: 'Test', type: 'contract', parties: [], created: '2026-01-01', status: 'draft', sections: sections.map(s => ({ id: s.id, file: `sections/${s.id}.md` })) },
    sections: sections.map(s => ({ id: s.id, file: `sections/${s.id}.md`, raw: s.raw, parsed: parseClauses(s.raw) })),
    tracking: { signatures: [], audit_log_ref: '', workflow_state: { current_reviewers: [], approvals: [] } },
  };
}

describe('diffDocuments', () => {
  it('returns empty diff for identical documents', () => {
    const doc = makeDoc([{ id: 'a', raw: 'Same text.' }]);
    const result = diffDocuments(doc, doc);
    expect(result.summary.added).toBe(0);
    expect(result.summary.removed).toBe(0);
    expect(result.summary.modified).toBe(0);
  });

  it('diffs matching sections by ID', () => {
    const old = makeDoc([{ id: 'intro', raw: '{{clause:x}}\nOld.\n{{/clause}}' }]);
    const new_ = makeDoc([{ id: 'intro', raw: '{{clause:x}}\nNew.\n{{/clause}}' }]);
    const result = diffDocuments(old, new_);
    expect(result.summary.modified).toBe(1);
    expect(result.sections[0].sectionId).toBe('intro');
  });

  it('detects added sections', () => {
    const old = makeDoc([]);
    const new_ = makeDoc([{ id: 'new-section', raw: 'Content.' }]);
    const result = diffDocuments(old, new_);
    expect(result.summary.added).toBeGreaterThan(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement full document diff**

Create `packages/core/src/diff/index.ts`:

```typescript
import type { LoadedDocument } from '../documents/reader.js';
import type { DocumentDiff } from './types.js';
import { diffSections } from './document-diff.js';
import { parseClauses } from '../documents/clause-parser.js';

export type { DocumentDiff, SectionDiff, Change } from './types.js';

export function diffDocuments(oldDoc: LoadedDocument, newDoc: LoadedDocument): DocumentDiff {
  const oldSectionMap = new Map(oldDoc.sections.map(s => [s.id, s]));
  const newSectionMap = new Map(newDoc.sections.map(s => [s.id, s]));
  const sections: DocumentDiff['sections'] = [];
  let added = 0, removed = 0, modified = 0, moved = 0;

  // Sections present in both
  for (const [id, newSection] of newSectionMap) {
    const oldSection = oldSectionMap.get(id);
    if (oldSection) {
      const diff = diffSections(oldSection.parsed, newSection.parsed);
      diff.sectionId = id;
      for (const c of diff.changes) {
        if (c.type === 'added') added++;
        else if (c.type === 'removed') removed++;
        else if (c.type === 'modified') modified++;
        else if (c.type === 'moved') moved++;
      }
      sections.push(diff);
    } else {
      // Entirely new section
      const diff = diffSections(parseClauses(''), newSection.parsed);
      diff.sectionId = id;
      added += diff.changes.length;
      sections.push(diff);
    }
  }

  // Removed sections
  for (const [id, oldSection] of oldSectionMap) {
    if (!newSectionMap.has(id)) {
      const diff = diffSections(oldSection.parsed, parseClauses(''));
      diff.sectionId = id;
      removed += diff.changes.length;
      sections.push(diff);
    }
  }

  return { sections, summary: { added, removed, modified, moved } };
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Commit**

```bash
git add packages/core/src/diff/ packages/core/src/__tests__/diff/
git commit -m "feat(core): add full document diff comparing LoadedDocuments"
```

---

## Phase 4: Workflow Engine (@gitlaw/core)

### Task 11: Workflow state machine

**Files:**
- Create: `packages/core/src/workflow/state-machine.ts`
- Test: `packages/core/src/__tests__/workflow/state-machine.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/workflow/state-machine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { transition, canTransition, type DocumentStatus } from '../../workflow/state-machine.js';

describe('workflow state machine', () => {
  it('allows draft -> review', () => {
    expect(canTransition('draft', 'review')).toBe(true);
    expect(transition('draft', 'review')).toBe('review');
  });

  it('allows review -> approved', () => {
    expect(canTransition('review', 'approved')).toBe(true);
  });

  it('allows review -> draft (rejection)', () => {
    expect(canTransition('review', 'draft')).toBe(true);
  });

  it('allows approved -> finalised', () => {
    expect(canTransition('approved', 'finalised')).toBe(true);
  });

  it('allows finalised -> archived', () => {
    expect(canTransition('finalised', 'archived')).toBe(true);
  });

  it('rejects invalid transitions', () => {
    expect(canTransition('draft', 'finalised')).toBe(false);
    expect(() => transition('draft', 'finalised')).toThrow();
  });

  it('rejects transitions from archived', () => {
    expect(canTransition('archived', 'draft')).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement state machine**

Create `packages/core/src/workflow/state-machine.ts`:

```typescript
export type DocumentStatus = 'draft' | 'review' | 'approved' | 'finalised' | 'archived';

const TRANSITIONS: Record<DocumentStatus, DocumentStatus[]> = {
  draft: ['review'],
  review: ['approved', 'draft'],       // draft = rejection
  approved: ['finalised', 'review'],    // review = re-review
  finalised: ['archived'],
  archived: [],
};

export function canTransition(from: DocumentStatus, to: DocumentStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function transition(from: DocumentStatus, to: DocumentStatus): DocumentStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition: ${from} -> ${to}`);
  }
  return to;
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Commit**

```bash
git add packages/core/src/workflow/ packages/core/src/__tests__/workflow/
git commit -m "feat(core): add document workflow state machine"
```

---

### Task 12: Review manager — request, approve, reject reviews

**Files:**
- Create: `packages/core/src/workflow/reviews.ts`
- Create: `packages/core/src/workflow/types.ts`
- Test: `packages/core/src/__tests__/workflow/reviews.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/workflow/reviews.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ReviewManager, type ReviewRecord } from '../../workflow/reviews.js';

describe('ReviewManager', () => {
  it('creates a review request', () => {
    const mgr = new ReviewManager();
    const request = mgr.requestReview({
      document: 'contracts/nda',
      reviewers: ['alice', 'bob'],
      requester: 'charlie',
      commit: 'abc123',
    });
    expect(request.reviewers).toEqual(['alice', 'bob']);
    expect(request.status).toBe('pending');
  });

  it('records an approval', () => {
    const mgr = new ReviewManager();
    mgr.requestReview({ document: 'contracts/nda', reviewers: ['alice'], requester: 'charlie', commit: 'abc123' });
    const review = mgr.submitReview({
      document: 'contracts/nda',
      reviewer: 'alice',
      decision: 'approved',
      comment: 'LGTM',
      commit: 'abc123',
    });
    expect(review.decision).toBe('approved');
  });

  it('records a rejection', () => {
    const mgr = new ReviewManager();
    mgr.requestReview({ document: 'contracts/nda', reviewers: ['alice'], requester: 'charlie', commit: 'abc123' });
    const review = mgr.submitReview({
      document: 'contracts/nda',
      reviewer: 'alice',
      decision: 'rejected',
      comment: 'Needs changes',
      commit: 'abc123',
    });
    expect(review.decision).toBe('rejected');
  });

  it('checks if all required approvals are met', () => {
    const mgr = new ReviewManager();
    mgr.requestReview({ document: 'contracts/nda', reviewers: ['alice', 'bob'], requester: 'charlie', commit: 'abc123' });
    mgr.submitReview({ document: 'contracts/nda', reviewer: 'alice', decision: 'approved', commit: 'abc123' });
    expect(mgr.isFullyApproved('contracts/nda')).toBe(false);
    mgr.submitReview({ document: 'contracts/nda', reviewer: 'bob', decision: 'approved', commit: 'abc123' });
    expect(mgr.isFullyApproved('contracts/nda')).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Create workflow types**

Create `packages/core/src/workflow/types.ts`:

```typescript
export interface ReviewRequest {
  document: string;
  reviewers: string[];
  requester: string;
  commit: string;
  timestamp: string;
  status: 'pending' | 'completed';
}

export interface ReviewRecord {
  document: string;
  reviewer: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  commit: string;
  timestamp: string;
}
```

**Step 4: Implement review manager**

Create `packages/core/src/workflow/reviews.ts`:

```typescript
import type { ReviewRequest, ReviewRecord } from './types.js';
export type { ReviewRecord } from './types.js';

interface RequestReviewInput {
  document: string;
  reviewers: string[];
  requester: string;
  commit: string;
}

interface SubmitReviewInput {
  document: string;
  reviewer: string;
  decision: 'approved' | 'rejected';
  comment?: string;
  commit: string;
}

export class ReviewManager {
  private requests: Map<string, ReviewRequest> = new Map();
  private reviews: Map<string, ReviewRecord[]> = new Map();

  requestReview(input: RequestReviewInput): ReviewRequest {
    const request: ReviewRequest = {
      ...input,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    this.requests.set(input.document, request);
    if (!this.reviews.has(input.document)) {
      this.reviews.set(input.document, []);
    }
    return request;
  }

  submitReview(input: SubmitReviewInput): ReviewRecord {
    const record: ReviewRecord = {
      ...input,
      timestamp: new Date().toISOString(),
    };
    const reviews = this.reviews.get(input.document) ?? [];
    reviews.push(record);
    this.reviews.set(input.document, reviews);
    return record;
  }

  isFullyApproved(document: string): boolean {
    const request = this.requests.get(document);
    if (!request) return false;
    const reviews = this.reviews.get(document) ?? [];
    const approved = new Set(
      reviews.filter(r => r.decision === 'approved').map(r => r.reviewer)
    );
    return request.reviewers.every(r => approved.has(r));
  }

  getReviews(document: string): ReviewRecord[] {
    return this.reviews.get(document) ?? [];
  }
}
```

**Step 5: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 6: Commit**

```bash
git add packages/core/src/workflow/ packages/core/src/__tests__/workflow/
git commit -m "feat(core): add review manager for approval workflows"
```

---

## Phase 5: Audit Trail (@gitlaw/core)

### Task 13: Audit log with hash chain

**Files:**
- Create: `packages/core/src/audit/audit-log.ts`
- Create: `packages/core/src/audit/types.ts`
- Test: `packages/core/src/__tests__/audit/audit-log.test.ts`

**Step 1: Write the failing test**

Create `packages/core/src/__tests__/audit/audit-log.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { AuditLog } from '../../audit/audit-log.js';

describe('AuditLog', () => {
  it('appends an entry with hash', () => {
    const log = new AuditLog();
    const entry = log.append({
      actor: 'alice',
      event: 'document_created',
      document: 'contracts/nda',
      commit: 'abc123',
      details: { title: 'NDA' },
    });
    expect(entry.id).toBeTruthy();
    expect(entry.prev).toBeNull();
    expect(entry.actor).toBe('alice');
  });

  it('chains entries via prev hash', () => {
    const log = new AuditLog();
    const first = log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    const second = log.append({ actor: 'bob', event: 'review_requested', document: 'nda', commit: 'def', details: {} });
    expect(second.prev).toBe(first.id);
  });

  it('verifies an intact chain', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    log.append({ actor: 'bob', event: 'review_requested', document: 'nda', commit: 'def', details: {} });
    expect(log.verify()).toBe(true);
  });

  it('detects a tampered chain', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    log.append({ actor: 'bob', event: 'review_requested', document: 'nda', commit: 'def', details: {} });
    // Tamper with the first entry
    log.entries[0].actor = 'eve';
    expect(log.verify()).toBe(false);
  });

  it('filters entries by document', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    log.append({ actor: 'alice', event: 'document_created', document: 'contract', commit: 'def', details: {} });
    expect(log.forDocument('nda')).toHaveLength(1);
  });

  it('serializes and deserializes', () => {
    const log = new AuditLog();
    log.append({ actor: 'alice', event: 'document_created', document: 'nda', commit: 'abc', details: {} });
    const json = log.serialize();
    const restored = AuditLog.deserialize(json);
    expect(restored.verify()).toBe(true);
    expect(restored.entries).toHaveLength(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Create audit types**

Create `packages/core/src/audit/types.ts`:

```typescript
export type AuditEventType =
  | 'document_created'
  | 'section_modified'
  | 'review_requested'
  | 'review_decision'
  | 'status_transition'
  | 'signature_added'
  | 'document_exported'
  | 'document_accessed';

export interface AuditEntry {
  id: string;
  prev: string | null;
  timestamp: string;
  actor: string;
  event: AuditEventType;
  document: string;
  commit: string;
  details: Record<string, unknown>;
}
```

**Step 4: Implement audit log**

Create `packages/core/src/audit/audit-log.ts`:

```typescript
import { createHash } from 'node:crypto';
import type { AuditEntry, AuditEventType } from './types.js';

interface AppendInput {
  actor: string;
  event: AuditEventType;
  document: string;
  commit: string;
  details: Record<string, unknown>;
}

function hashEntry(entry: Omit<AuditEntry, 'id'>): string {
  const content = JSON.stringify({
    prev: entry.prev,
    timestamp: entry.timestamp,
    actor: entry.actor,
    event: entry.event,
    document: entry.document,
    commit: entry.commit,
    details: entry.details,
  });
  return createHash('sha256').update(content).digest('hex');
}

export class AuditLog {
  entries: AuditEntry[] = [];

  append(input: AppendInput): AuditEntry {
    const prev = this.entries.length > 0 ? this.entries[this.entries.length - 1].id : null;
    const partial = {
      prev,
      timestamp: new Date().toISOString(),
      actor: input.actor,
      event: input.event,
      document: input.document,
      commit: input.commit,
      details: input.details,
    };
    const id = hashEntry(partial);
    const entry: AuditEntry = { id, ...partial };
    this.entries.push(entry);
    return entry;
  }

  verify(): boolean {
    for (let i = 0; i < this.entries.length; i++) {
      const entry = this.entries[i];
      const expectedPrev = i > 0 ? this.entries[i - 1].id : null;
      if (entry.prev !== expectedPrev) return false;

      const { id, ...rest } = entry;
      const expectedId = hashEntry(rest);
      if (id !== expectedId) return false;
    }
    return true;
  }

  forDocument(document: string): AuditEntry[] {
    return this.entries.filter(e => e.document === document);
  }

  serialize(): string {
    return JSON.stringify(this.entries);
  }

  static deserialize(json: string): AuditLog {
    const log = new AuditLog();
    log.entries = JSON.parse(json);
    return log;
  }
}
```

**Step 5: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 6: Commit**

```bash
git add packages/core/src/audit/ packages/core/src/__tests__/audit/
git commit -m "feat(core): add hash-chained audit log with verification"
```

---

## Phase 6: Core Exports & Integration

### Task 14: Wire up @gitlaw/core public API

**Files:**
- Modify: `packages/core/src/index.ts`
- Test: `packages/core/src/__tests__/index.test.ts` (update)

**Step 1: Update the core index to re-export all modules**

Replace `packages/core/src/index.ts`:

```typescript
export const VERSION = '0.1.0';

// Document model
export { validateDocumentMeta } from './documents/schema.js';
export { parseClauses } from './documents/clause-parser.js';
export { readDocument } from './documents/reader.js';
export { writeDocument } from './documents/writer.js';
export type { DocumentMeta, DocumentStatus, DocumentType, Party, SectionRef, GitlawTracking, Signature, WorkflowState } from './documents/types.js';
export type { LoadedDocument, LoadedSection } from './documents/reader.js';
export type { ParsedSection, ClauseBlock, ParagraphBlock } from './documents/clause-parser.js';

// Diffing
export { diffDocuments } from './diff/index.js';
export { wordDiff } from './diff/word-diff.js';
export type { DocumentDiff, SectionDiff, Change } from './diff/types.js';
export type { WordChange } from './diff/word-diff.js';

// Workflow
export { canTransition, transition } from './workflow/state-machine.js';
export { ReviewManager } from './workflow/reviews.js';
export type { ReviewRequest, ReviewRecord } from './workflow/types.js';

// Audit
export { AuditLog } from './audit/audit-log.js';
export type { AuditEntry, AuditEventType } from './audit/types.js';
```

**Step 2: Update the smoke test**

Update `packages/core/src/__tests__/index.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { VERSION, validateDocumentMeta, parseClauses, diffDocuments, canTransition, ReviewManager, AuditLog } from '../index.js';

describe('core public API', () => {
  it('exports version', () => {
    expect(VERSION).toBe('0.1.0');
  });

  it('exports document utilities', () => {
    expect(typeof validateDocumentMeta).toBe('function');
    expect(typeof parseClauses).toBe('function');
  });

  it('exports diff utilities', () => {
    expect(typeof diffDocuments).toBe('function');
  });

  it('exports workflow utilities', () => {
    expect(typeof canTransition).toBe('function');
    expect(ReviewManager).toBeDefined();
  });

  it('exports audit utilities', () => {
    expect(AuditLog).toBeDefined();
  });
});
```

**Step 3: Build and run all tests**

Run: `pnpm --filter @gitlaw/core build && pnpm --filter @gitlaw/core test`
Expected: build succeeds, all tests pass

**Step 4: Commit**

```bash
git add packages/core/src/index.ts packages/core/src/__tests__/index.test.ts
git commit -m "feat(core): wire up public API exports"
```

---

## Phase 7: CLI Commands (@gitlaw/cli)

### Task 15: `gitlaw init` command

**Files:**
- Create: `packages/cli/src/commands/init.ts`
- Test: `packages/cli/src/__tests__/commands/init.test.ts`

**Step 1: Write the failing test**

Create `packages/cli/src/__tests__/commands/init.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

describe('gitlaw init', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-init-'));
    execFileSync('git', ['init', dir]);
  });

  it('creates .gitlaw/ config directory', async () => {
    const { initGitlawRepo } = await import('../../commands/init.js');
    await initGitlawRepo(dir);
    expect(existsSync(join(dir, '.gitlaw', 'config.yaml'))).toBe(true);
  });

  it('creates default workflow config', async () => {
    const { initGitlawRepo } = await import('../../commands/init.js');
    await initGitlawRepo(dir);
    const config = await readFile(join(dir, '.gitlaw', 'config.yaml'), 'utf-8');
    expect(config).toContain('min_approvals');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/cli test`
Expected: FAIL

**Step 3: Implement init command**

Create `packages/cli/src/commands/init.ts`:

```typescript
import { Command, Flags } from '@oclif/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const DEFAULT_CONFIG = `workflows:
  default:
    review:
      min_approvals: 1
      required_reviewers: []
      allow_self_approval: false
    finalisation:
      requires_all_reviewers: true
      requires_signature: true
`;

export async function initGitlawRepo(dir: string): Promise<void> {
  const gitlawDir = join(dir, '.gitlaw');
  await mkdir(gitlawDir, { recursive: true });
  await writeFile(join(gitlawDir, 'config.yaml'), DEFAULT_CONFIG);
}

export default class Init extends Command {
  static override description = 'Initialize a gitlaw repository';

  static override flags = {
    template: Flags.string({ description: 'Template type', required: false }),
  };

  async run(): Promise<void> {
    const gitDir = join(process.cwd(), '.git');
    if (!existsSync(gitDir)) {
      this.error('Not a git repository. Run "git init" first.');
    }

    await initGitlawRepo(process.cwd());
    this.log('Initialized gitlaw repository.');
  }
}
```

**Step 4: Add vitest config for CLI**

Create `packages/cli/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Add vitest to cli devDependencies in `packages/cli/package.json`.

**Step 5: Run tests**

Run: `pnpm install && pnpm --filter @gitlaw/cli test`
Expected: tests pass

**Step 6: Commit**

```bash
git add packages/cli/
git commit -m "feat(cli): add gitlaw init command"
```

---

### Task 16: `gitlaw new` command

**Files:**
- Create: `packages/cli/src/commands/new.ts`
- Test: `packages/cli/src/__tests__/commands/new.test.ts`

**Step 1: Write the failing test**

Create `packages/cli/src/__tests__/commands/new.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

describe('gitlaw new', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-new-'));
    execFileSync('git', ['init', dir]);
  });

  it('creates a document directory with canonical structure', async () => {
    const { createNewDocument } = await import('../../commands/new.js');
    await createNewDocument(dir, 'acme-nda', 'contract');
    expect(existsSync(join(dir, 'acme-nda', 'document.yaml'))).toBe(true);
    expect(existsSync(join(dir, 'acme-nda', 'sections'))).toBe(true);
    expect(existsSync(join(dir, 'acme-nda', '.gitlaw'))).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/cli test`
Expected: FAIL

**Step 3: Implement new command**

Create `packages/cli/src/commands/new.ts`:

```typescript
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
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/cli test`
Expected: tests pass

**Step 5: Commit**

```bash
git add packages/cli/src/commands/new.ts packages/cli/src/__tests__/commands/new.test.ts
git commit -m "feat(cli): add gitlaw new command"
```

---

### Task 17: `gitlaw status` command

**Files:**
- Create: `packages/cli/src/commands/status.ts`
- Test: `packages/cli/src/__tests__/commands/status.test.ts`

**Step 1: Write the failing test**

Create `packages/cli/src/__tests__/commands/status.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createNewDocument } from '../../commands/new.js';

describe('gitlaw status', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-status-'));
    execFileSync('git', ['init', dir]);
  });

  it('finds and reports document statuses', async () => {
    await createNewDocument(dir, 'nda', 'contract');
    await createNewDocument(dir, 'policy', 'policy');

    const { getRepoStatus } = await import('../../commands/status.js');
    const statuses = await getRepoStatus(dir);
    expect(statuses).toHaveLength(2);
    expect(statuses[0].status).toBe('draft');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/cli test`
Expected: FAIL

**Step 3: Implement status command**

Create `packages/cli/src/commands/status.ts`:

```typescript
import { Command } from '@oclif/core';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readDocument } from '@gitlaw/core';

interface DocStatus {
  name: string;
  title: string;
  type: string;
  status: string;
}

export async function getRepoStatus(dir: string): Promise<DocStatus[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const statuses: DocStatus[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const docYaml = join(dir, entry.name, 'document.yaml');
    if (!existsSync(docYaml)) continue;

    const doc = await readDocument(join(dir, entry.name));
    statuses.push({
      name: entry.name,
      title: doc.meta.title,
      type: doc.meta.type,
      status: doc.meta.status,
    });
  }

  return statuses;
}

export default class Status extends Command {
  static override description = 'Show document statuses';

  async run(): Promise<void> {
    const statuses = await getRepoStatus(process.cwd());
    if (statuses.length === 0) {
      this.log('No gitlaw documents found.');
      return;
    }
    for (const doc of statuses) {
      this.log(`  ${doc.name}  [${doc.status}]  ${doc.title} (${doc.type})`);
    }
  }
}
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/cli test`
Expected: tests pass

**Step 5: Commit**

```bash
git add packages/cli/src/commands/status.ts packages/cli/src/__tests__/commands/status.test.ts
git commit -m "feat(cli): add gitlaw status command"
```

---

### Task 18: `gitlaw diff` and `gitlaw redline` commands

**Files:**
- Create: `packages/cli/src/commands/diff.ts`
- Create: `packages/cli/src/commands/redline.ts`

**Step 1: Implement diff command**

Create `packages/cli/src/commands/diff.ts`:

```typescript
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
```

**Step 2: Implement redline command (Markdown output for MVP)**

Create `packages/cli/src/commands/redline.ts`:

```typescript
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
```

**Step 3: Build and verify**

Run: `pnpm --filter @gitlaw/cli build`
Expected: builds without errors

**Step 4: Commit**

```bash
git add packages/cli/src/commands/diff.ts packages/cli/src/commands/redline.ts
git commit -m "feat(cli): add gitlaw diff and redline commands"
```

---

### Task 19: `gitlaw review` subcommands

**Files:**
- Create: `packages/cli/src/commands/review/request.ts`
- Create: `packages/cli/src/commands/review/approve.ts`
- Create: `packages/cli/src/commands/review/reject.ts`
- Create: `packages/cli/src/commands/review/status.ts`

**Step 1: Create review request command**

Create `packages/cli/src/commands/review/request.ts`:

```typescript
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

    // Update status to review
    doc.meta.status = 'review';
    await writeFile(join(docDir, 'document.yaml'), yaml.dump(doc.meta));
    await writeFile(join(docDir, '.gitlaw'), yaml.dump(doc.tracking));

    this.log(`Review requested from: ${reviewers.join(', ')}`);
  }
}
```

**Step 2: Create review approve command**

Create `packages/cli/src/commands/review/approve.ts`:

```typescript
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
```

**Step 3: Create review reject command**

Create `packages/cli/src/commands/review/reject.ts`:

```typescript
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
```

**Step 4: Create review status command**

Create `packages/cli/src/commands/review/status.ts`:

```typescript
import { Command, Args } from '@oclif/core';
import { readDocument } from '@gitlaw/core';
import { join } from 'node:path';

export default class ReviewStatus extends Command {
  static override description = 'Show review status for a document';

  static override args = {
    document: Args.string({ description: 'Document directory', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(ReviewStatus);
    const docDir = join(process.cwd(), args.document);
    const doc = await readDocument(docDir);

    this.log(`Document: ${doc.meta.title}`);
    this.log(`Status: ${doc.meta.status}`);
    this.log(`Reviewers: ${doc.tracking.workflow_state.current_reviewers.join(', ') || 'none'}`);
    this.log(`Approvals: ${doc.tracking.workflow_state.approvals.join(', ') || 'none'}`);
  }
}
```

**Step 5: Build and verify**

Run: `pnpm --filter @gitlaw/cli build`
Expected: builds without errors

**Step 6: Commit**

```bash
git add packages/cli/src/commands/review/
git commit -m "feat(cli): add gitlaw review subcommands (request, approve, reject, status)"
```

---

### Task 20: `gitlaw audit` subcommands

**Files:**
- Create: `packages/cli/src/commands/audit/log.ts`
- Create: `packages/cli/src/commands/audit/verify.ts`
- Create: `packages/cli/src/commands/audit/export.ts`

**Step 1: Create audit log command**

Create `packages/cli/src/commands/audit/log.ts`:

```typescript
import { Command, Args } from '@oclif/core';
import { AuditLog } from '@gitlaw/core';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function getAuditLogPath(baseDir: string): string {
  return join(baseDir, '.gitlaw', 'audit.json');
}

export async function loadAuditLog(baseDir: string): Promise<AuditLog> {
  const path = getAuditLogPath(baseDir);
  if (!existsSync(path)) return new AuditLog();
  const json = await readFile(path, 'utf-8');
  return AuditLog.deserialize(json);
}

export default class AuditLogCmd extends Command {
  static override description = 'View audit log for a document';

  static override args = {
    document: Args.string({ description: 'Document directory', required: true }),
  };

  async run(): Promise<void> {
    const { args } = await this.parse(AuditLogCmd);
    const log = await loadAuditLog(process.cwd());
    const entries = log.forDocument(args.document);

    if (entries.length === 0) {
      this.log('No audit entries found.');
      return;
    }

    for (const entry of entries) {
      this.log(`[${entry.timestamp}] ${entry.event} by ${entry.actor} (${entry.id.substring(0, 8)})`);
    }
  }
}
```

**Step 2: Create audit verify command**

Create `packages/cli/src/commands/audit/verify.ts`:

```typescript
import { Command } from '@oclif/core';
import { loadAuditLog } from './log.js';

export default class AuditVerify extends Command {
  static override description = 'Verify audit log integrity';

  async run(): Promise<void> {
    const log = await loadAuditLog(process.cwd());

    if (log.entries.length === 0) {
      this.log('No audit entries to verify.');
      return;
    }

    if (log.verify()) {
      this.log(`Audit log verified: ${log.entries.length} entries, chain intact.`);
    } else {
      this.error('AUDIT LOG INTEGRITY FAILURE: chain is broken or tampered.');
    }
  }
}
```

**Step 3: Create audit export command**

Create `packages/cli/src/commands/audit/export.ts`:

```typescript
import { Command, Args, Flags } from '@oclif/core';
import { writeFile } from 'node:fs/promises';
import { loadAuditLog } from './log.js';

export default class AuditExport extends Command {
  static override description = 'Export audit log';

  static override args = {
    document: Args.string({ description: 'Document to export audit for', required: true }),
  };

  static override flags = {
    format: Flags.string({ description: 'Output format', options: ['json', 'csv'], default: 'json' }),
    output: Flags.string({ description: 'Output file', char: 'o' }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuditExport);
    const log = await loadAuditLog(process.cwd());
    const entries = log.forDocument(args.document);

    let output: string;
    if (flags.format === 'csv') {
      const header = 'id,timestamp,actor,event,document,commit';
      const rows = entries.map(e => `${e.id},${e.timestamp},${e.actor},${e.event},${e.document},${e.commit}`);
      output = [header, ...rows].join('\n');
    } else {
      output = JSON.stringify(entries, null, 2);
    }

    if (flags.output) {
      await writeFile(flags.output, output);
      this.log(`Exported to ${flags.output}`);
    } else {
      this.log(output);
    }
  }
}
```

**Step 4: Build and verify**

Run: `pnpm --filter @gitlaw/cli build`
Expected: builds without errors

**Step 5: Commit**

```bash
git add packages/cli/src/commands/audit/
git commit -m "feat(cli): add gitlaw audit subcommands (log, verify, export)"
```

---

### Task 21: `gitlaw clause` subcommands

**Files:**
- Create: `packages/core/src/documents/clause-library.ts`
- Create: `packages/cli/src/commands/clause/list.ts`
- Create: `packages/cli/src/commands/clause/add.ts`
- Test: `packages/core/src/__tests__/documents/clause-library.test.ts`

**Step 1: Write the failing test for clause library**

Create `packages/core/src/__tests__/documents/clause-library.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ClauseLibrary } from '../../documents/clause-library.js';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('ClauseLibrary', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'gitlaw-clauses-'));
  });

  it('adds and retrieves a clause', async () => {
    const lib = new ClauseLibrary(join(dir, '.gitlaw', 'clauses'));
    await lib.add('confidentiality', 'All information shall remain confidential.');
    const clause = await lib.get('confidentiality');
    expect(clause).toContain('confidential');
  });

  it('lists all clauses', async () => {
    const lib = new ClauseLibrary(join(dir, '.gitlaw', 'clauses'));
    await lib.add('clause-a', 'Content A');
    await lib.add('clause-b', 'Content B');
    const list = await lib.list();
    expect(list).toContain('clause-a');
    expect(list).toContain('clause-b');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @gitlaw/core test`
Expected: FAIL

**Step 3: Implement clause library**

Create `packages/core/src/documents/clause-library.ts`:

```typescript
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
```

**Step 4: Run tests**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass

**Step 5: Add ClauseLibrary to core exports**

Add to `packages/core/src/index.ts`:

```typescript
export { ClauseLibrary } from './documents/clause-library.js';
```

**Step 6: Create CLI clause commands**

Create `packages/cli/src/commands/clause/list.ts`:

```typescript
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
```

Create `packages/cli/src/commands/clause/add.ts`:

```typescript
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
```

**Step 7: Build and verify**

Run: `pnpm install && pnpm --filter @gitlaw/core build && pnpm --filter @gitlaw/cli build`
Expected: builds without errors

**Step 8: Commit**

```bash
git add packages/core/src/documents/clause-library.ts packages/core/src/__tests__/documents/clause-library.test.ts packages/core/src/index.ts packages/cli/src/commands/clause/
git commit -m "feat: add clause library to core and CLI commands"
```

---

## Phase 8: Web App Scaffold (@gitlaw/web)

### Task 22: Scaffold Next.js app

**Files:**
- Create: `packages/web/package.json`
- Create: `packages/web/tsconfig.json`
- Create: `packages/web/next.config.ts`
- Create: `packages/web/src/app/layout.tsx`
- Create: `packages/web/src/app/page.tsx`

**Step 1: Create packages/web/package.json**

```json
{
  "name": "@gitlaw/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "clean": "rm -rf .next"
  },
  "dependencies": {
    "@gitlaw/core": "workspace:*",
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5"
  }
}
```

**Step 2: Create packages/web/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Step 3: Create packages/web/next.config.ts**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@gitlaw/core'],
};

export default nextConfig;
```

**Step 4: Create layout**

Create `packages/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'gitlaw',
  description: 'Git-based version control for legal documents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**Step 5: Create landing page**

Create `packages/web/src/app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main>
      <h1>gitlaw</h1>
      <p>Git-based version control for legal documents.</p>
    </main>
  );
}
```

**Step 6: Install and verify build**

Run: `pnpm install && pnpm --filter @gitlaw/web build`
Expected: Next.js builds successfully

**Step 7: Commit**

```bash
git add packages/web/
git commit -m "chore: scaffold @gitlaw/web Next.js app"
```

---

### Task 23: Document viewer page

**Files:**
- Create: `packages/web/src/app/documents/[name]/page.tsx`
- Create: `packages/web/src/components/document-viewer.tsx`
- Create: `packages/web/src/components/section-nav.tsx`

**Step 1: Create section navigation component**

Create `packages/web/src/components/section-nav.tsx`:

```tsx
interface SectionNavProps {
  sections: { id: string; file: string }[];
  activeSection?: string;
  onSelect: (id: string) => void;
}

export function SectionNav({ sections, activeSection, onSelect }: SectionNavProps) {
  return (
    <nav>
      <h3>Sections</h3>
      <ul>
        {sections.map(s => (
          <li key={s.id}>
            <button
              onClick={() => onSelect(s.id)}
              style={{ fontWeight: activeSection === s.id ? 'bold' : 'normal' }}
            >
              {s.id}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

**Step 2: Create document viewer component**

Create `packages/web/src/components/document-viewer.tsx`:

Note: When rendering user-generated content, sanitize HTML with DOMPurify before display. The implementation should install `dompurify` and `@types/dompurify`, then sanitize content before rendering.

```tsx
interface DocumentViewerProps {
  title: string;
  type: string;
  status: string;
  parties: { name: string; role: string }[];
  sections: { id: string; content: string }[];
}

export function DocumentViewer({ title, type, status, parties, sections }: DocumentViewerProps) {
  return (
    <article>
      <header>
        <h1>{title}</h1>
        <span>{type}</span>
        <span>{status}</span>
      </header>

      {parties.length > 0 && (
        <section>
          <h2>Parties</h2>
          <ul>
            {parties.map((p, i) => (
              <li key={i}>{p.name} ({p.role})</li>
            ))}
          </ul>
        </section>
      )}

      {sections.map(s => (
        <section key={s.id} id={s.id}>
          <pre>{s.content}</pre>
        </section>
      ))}
    </article>
  );
}
```

**Step 3: Create document page (static placeholder for now)**

Create `packages/web/src/app/documents/[name]/page.tsx`:

```tsx
export default async function DocumentPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  return (
    <main>
      <h1>Document: {name}</h1>
      <p>Document viewer will load from gitlaw repo here.</p>
    </main>
  );
}
```

**Step 4: Build and verify**

Run: `pnpm --filter @gitlaw/web build`
Expected: builds without errors

**Step 5: Commit**

```bash
git add packages/web/src/
git commit -m "feat(web): add document viewer components and page"
```

---

### Task 24: Dashboard page

**Files:**
- Create: `packages/web/src/components/dashboard.tsx`
- Modify: `packages/web/src/app/page.tsx`

**Step 1: Create dashboard component**

Create `packages/web/src/components/dashboard.tsx`:

```tsx
interface DocumentSummary {
  name: string;
  title: string;
  type: string;
  status: string;
}

interface DashboardProps {
  documents: DocumentSummary[];
}

export function Dashboard({ documents }: DashboardProps) {
  if (documents.length === 0) {
    return (
      <div>
        <h2>No documents</h2>
        <p>Create a document with <code>gitlaw new</code></p>
      </div>
    );
  }

  return (
    <div>
      <h2>Documents</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Title</th>
            <th>Type</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {documents.map(doc => (
            <tr key={doc.name}>
              <td><a href={`/documents/${doc.name}`}>{doc.name}</a></td>
              <td>{doc.title}</td>
              <td>{doc.type}</td>
              <td>{doc.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Update landing page**

Replace `packages/web/src/app/page.tsx`:

```tsx
import { Dashboard } from '@/components/dashboard';

export default function Home() {
  // Placeholder — will be wired to gitlaw core in local/remote mode
  const documents: { name: string; title: string; type: string; status: string }[] = [];

  return (
    <main>
      <h1>gitlaw</h1>
      <Dashboard documents={documents} />
    </main>
  );
}
```

**Step 3: Build and verify**

Run: `pnpm --filter @gitlaw/web build`
Expected: builds without errors

**Step 4: Commit**

```bash
git add packages/web/src/
git commit -m "feat(web): add dashboard component and wire to landing page"
```

---

## Phase 9: End-to-End Smoke Test

### Task 25: Integration test — full workflow

**Files:**
- Create: `packages/core/src/__tests__/integration/full-workflow.test.ts`

**Step 1: Write end-to-end test**

Create `packages/core/src/__tests__/integration/full-workflow.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  writeDocument,
  readDocument,
  diffDocuments,
  validateDocumentMeta,
  canTransition,
  ReviewManager,
  AuditLog,
} from '../../index.js';
import type { DocumentMeta } from '../../index.js';

describe('full workflow integration', () => {
  it('creates, reads, diffs, reviews, and audits a document', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'gitlaw-e2e-'));
    const docDir = join(dir, 'test-nda');

    // 1. Create document
    const meta: DocumentMeta = {
      title: 'Test NDA',
      type: 'contract',
      parties: [{ name: 'Acme', role: 'disclosing' }],
      created: '2026-02-27',
      status: 'draft',
      sections: [{ id: 'defs', file: 'sections/01-defs.md' }],
    };
    expect(validateDocumentMeta(meta).valid).toBe(true);

    await writeDocument(docDir, meta, new Map([
      ['sections/01-defs.md', '{{clause:conf}}\nOld definition.\n{{/clause}}\n'],
    ]));

    // 2. Read it back
    const doc = await readDocument(docDir);
    expect(doc.meta.title).toBe('Test NDA');
    expect(doc.sections[0].parsed.clauses[0].id).toBe('conf');

    // 3. Create a modified version
    const docDir2 = join(dir, 'test-nda-v2');
    const meta2 = { ...meta, status: 'review' as const };
    await writeDocument(docDir2, meta2, new Map([
      ['sections/01-defs.md', '{{clause:conf}}\nUpdated definition.\n{{/clause}}\n'],
    ]));
    const doc2 = await readDocument(docDir2);

    // 4. Diff
    const diff = diffDocuments(doc, doc2);
    expect(diff.summary.modified).toBe(1);

    // 5. Workflow
    expect(canTransition('draft', 'review')).toBe(true);
    const mgr = new ReviewManager();
    mgr.requestReview({ document: 'test-nda', reviewers: ['alice'], requester: 'bob', commit: 'abc' });
    mgr.submitReview({ document: 'test-nda', reviewer: 'alice', decision: 'approved', commit: 'abc' });
    expect(mgr.isFullyApproved('test-nda')).toBe(true);

    // 6. Audit
    const log = new AuditLog();
    log.append({ actor: 'bob', event: 'document_created', document: 'test-nda', commit: 'abc', details: {} });
    log.append({ actor: 'alice', event: 'review_decision', document: 'test-nda', commit: 'abc', details: { decision: 'approved' } });
    expect(log.verify()).toBe(true);
    expect(log.forDocument('test-nda')).toHaveLength(2);
  });
});
```

**Step 2: Run the full test suite**

Run: `pnpm --filter @gitlaw/core test`
Expected: all tests pass including integration test

**Step 3: Commit**

```bash
git add packages/core/src/__tests__/integration/
git commit -m "test: add end-to-end integration test for full workflow"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1. Scaffolding | 1-3 | Monorepo with core, cli, web packages |
| 2. Document Model | 4-7 | Types, schema validation, clause parsing, read/write |
| 3. Diffing Engine | 8-10 | Word, clause, paragraph, and full document diffing |
| 4. Workflow Engine | 11-12 | State machine, review manager |
| 5. Audit Trail | 13 | Hash-chained audit log with verification |
| 6. Core Integration | 14 | Public API exports |
| 7. CLI Commands | 15-21 | init, new, status, diff, redline, review, audit, clause |
| 8. Web Scaffold | 22-24 | Next.js app with dashboard and document viewer |
| 9. Integration | 25 | End-to-end smoke test |

**Total: 25 tasks across 9 phases.**
