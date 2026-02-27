import { describe, it, expect } from 'vitest';
import { wordDiff } from '../../diff/word-diff.js';

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
