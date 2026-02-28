import type { ParsedSection } from '../documents/clause-parser.js';
import type { Change, SectionDiff } from './types.js';
import { wordDiff } from './word-diff.js';

export function diffSections(oldParsed: ParsedSection, newParsed: ParsedSection): SectionDiff {
  const changes: Change[] = [];

  const oldClauseMap = new Map(oldParsed.clauses.map(c => [c.id, c]));
  const newClauseMap = new Map(newParsed.clauses.map(c => [c.id, c]));

  for (const [id, clause] of oldClauseMap) {
    if (!newClauseMap.has(id)) {
      changes.push({ type: 'removed', clauseId: id, location: { paragraph: clause.startLine }, old: clause.content });
    }
  }

  for (const [id, clause] of newClauseMap) {
    if (!oldClauseMap.has(id)) {
      changes.push({ type: 'added', clauseId: id, location: { paragraph: clause.startLine }, new: clause.content });
    }
  }

  for (const [id, newClause] of newClauseMap) {
    const oldClause = oldClauseMap.get(id);
    if (oldClause && oldClause.content !== newClause.content) {
      changes.push({
        type: 'modified', clauseId: id, location: { paragraph: newClause.startLine },
        old: oldClause.content, new: newClause.content, wordDiff: wordDiff(oldClause.content, newClause.content),
      });
    }
  }

  const maxLen = Math.max(oldParsed.paragraphs.length, newParsed.paragraphs.length);
  for (let i = 0; i < maxLen; i++) {
    const oldP = oldParsed.paragraphs[i];
    const newP = newParsed.paragraphs[i];
    if (!oldP && newP) {
      changes.push({ type: 'added', location: { paragraph: newP.startLine }, new: newP.content });
    } else if (oldP && !newP) {
      changes.push({ type: 'removed', location: { paragraph: oldP.startLine }, old: oldP.content });
    } else if (oldP && newP && oldP.content !== newP.content) {
      changes.push({ type: 'modified', location: { paragraph: newP.startLine }, old: oldP.content, new: newP.content, wordDiff: wordDiff(oldP.content, newP.content) });
    }
  }

  return { changes };
}
