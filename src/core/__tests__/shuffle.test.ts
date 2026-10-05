import { describe, it, expect } from 'vitest';
import { seededRandom, seededShuffle } from '../shuffle';

describe('shuffle', () => {
  it('Same seed → same shuffle result (deterministic)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuf1 = seededShuffle(arr, 123);
    const shuf2 = seededShuffle(arr, 123);
    expect(shuf1).toEqual(shuf2);
  });

  it('Different seeds → different results', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuf1 = seededShuffle(arr, 123);
    const shuf2 = seededShuffle(arr, 456);
    expect(shuf1).not.toEqual(shuf2);
  });

  it('Shuffle doesn\'t mutate original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    seededShuffle(arr, 123);
    expect(arr).toEqual(copy);
  });

  it('Shuffle preserves all elements (no loss)', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuf = seededShuffle(arr, 123);
    expect(shuf.sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b));
    expect(shuf.length).toBe(arr.length);
  });

  it('seededRandom produces values in [0, 1)', () => {
    const random = seededRandom(123);
    for (let i = 0; i < 100; i++) {
      const val = random();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });
});
