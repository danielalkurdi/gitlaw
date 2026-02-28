import { describe, it, expect } from 'vitest';
import { transition, canTransition } from '../../workflow/state-machine.js';

describe('workflow state machine', () => {
  it('allows draft -> review', () => {
    expect(canTransition('draft', 'review')).toBe(true);
    expect(transition('draft', 'review')).toBe('review');
  });
  it('allows review -> approved', () => { expect(canTransition('review', 'approved')).toBe(true); });
  it('allows review -> draft (rejection)', () => { expect(canTransition('review', 'draft')).toBe(true); });
  it('allows approved -> finalised', () => { expect(canTransition('approved', 'finalised')).toBe(true); });
  it('allows finalised -> archived', () => { expect(canTransition('finalised', 'archived')).toBe(true); });
  it('rejects invalid transitions', () => {
    expect(canTransition('draft', 'finalised')).toBe(false);
    expect(() => transition('draft', 'finalised')).toThrow();
  });
  it('rejects transitions from archived', () => { expect(canTransition('archived', 'draft')).toBe(false); });
});
