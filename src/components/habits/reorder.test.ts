import { describe, expect, it } from 'vitest';
import { swap } from './reorder';

describe('swap', () => {
  it('exchanges two adjacent positions', () => {
    expect(swap([1, 2, 3], 0, 1)).toEqual([2, 1, 3]);
    expect(swap([1, 2, 3], 1, 2)).toEqual([1, 3, 2]);
  });

  it('does not mutate the input array', () => {
    const ids = [1, 2, 3];
    swap(ids, 0, 1);
    expect(ids).toEqual([1, 2, 3]);
  });

  it('is a no-op for equal indices', () => {
    expect(swap([1, 2, 3], 1, 1)).toEqual([1, 2, 3]);
  });

  it('is a no-op for out-of-range indices (defensive guard)', () => {
    const ids = [1, 2, 3];
    expect(swap(ids, -1, 0)).toEqual([1, 2, 3]);
    expect(swap(ids, 2, 3)).toEqual([1, 2, 3]);
    expect(swap(ids, 5, 6)).toEqual([1, 2, 3]);
  });

  it('handles single-element and empty lists', () => {
    expect(swap([7], 0, 0)).toEqual([7]);
    expect(swap([], 0, 1)).toEqual([]);
  });
});
