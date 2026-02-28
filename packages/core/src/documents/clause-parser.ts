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

      if (line.trim() === '') {
        flushUnmarked();
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
