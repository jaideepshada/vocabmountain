import { describe, it, expect } from 'vitest';
import { validateDeck, getWordsForDays, getWordById } from '../deck';
import type { Word } from '../types';

function mockWord(id: number, day: number): Word {
  return { id, day, word: `word${id}`, partOfSpeech: 'Noun', senses: [{ definition: `def${id}`, example: `ex${id}`, synonyms: [] }] };
}
function mockDeck(): Word[] {
  return Array.from({ length: 1020 }, (_, i) => mockWord(i + 1, Math.floor(i / 30) + 1));
}

describe('deck', () => {
  it('validateDeck rejects non-array', () => {
    expect(() => validateDeck({})).toThrow();
  });

  it('validateDeck rejects empty array', () => {
    expect(() => validateDeck([])).toThrow();
  });

  it('validateDeck rejects wrong count', () => {
    const deck = mockDeck().slice(0, 10);
    expect(() => validateDeck(deck)).toThrow();
  });

  it('validateDeck rejects duplicate ids', () => {
    const deck = mockDeck();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    deck[1] = deck[0]!;
    expect(() => validateDeck(deck)).toThrow();
  });

  it('getWordsForDays filters correctly for a single day', () => {
    const deck = mockDeck();
    const words = getWordsForDays(deck, 1, 1);
    expect(words.length).toBe(30);
    expect(words.every((w) => w.day === 1)).toBe(true);
  });

  it('getWordsForDays filters correctly for a range', () => {
    const deck = mockDeck();
    const words = getWordsForDays(deck, 1, 3);
    expect(words.length).toBe(90);
    expect(words.every((w) => w.day >= 1 && w.day <= 3)).toBe(true);
  });

  it('getWordById returns correct word', () => {
    const deck = mockDeck();
    const word = getWordById(deck, 5);
    expect(word).toBeDefined();
    expect(word?.id).toBe(5);
  });

  it('getWordById returns undefined for missing id', () => {
    const deck = mockDeck();
    const word = getWordById(deck, 9999);
    expect(word).toBeUndefined();
  });
});
