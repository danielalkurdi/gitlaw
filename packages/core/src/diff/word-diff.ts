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
