import { describe, it, expect } from 'vitest';
import { coveredDays,
  deriveSessionState,
  buildSessionDeck,
  buildOrderedCardList,
  nextCardIndex,
  isSessionComplete,
  getMissedWordIds,
} from '../session';
import type { MarkResult, ReviewEvent, Word } from '../types';

function makeEvent(wordId: number, result: MarkResult, sessionId = 'sess1', offset = 0): ReviewEvent {
  return {
    eventId: `evt-${wordId}-${offset}`,
    wordId,
    result,
    reviewedAt: new Date(2024, 0, 1, 0, 0, offset).toISOString(),
    sessionId,
    sessionType: 'normal',
  };
}

function mockWord(id: number, day = 1): Word {
  return {
    id,
    day,
    word: `word${id}`,
    partOfSpeech: 'Noun',
    senses: [{ definition: `def${id}`, example: `ex${id}`, synonyms: [] }],
  };
}

describe('session', () => {
  it('All cards start unrated in a new session (no events)', () => {
    const state = deriveSessionState([1, 2, 3], [], 'sess1');
    expect(state.unratedCount).toBe(3);
    expect(state.cardStatuses.get(1)).toBe('unrated');
  });

  it('Marking a card memorised makes it green', () => {
    const state = deriveSessionState([1, 2, 3], [makeEvent(1, 'memorised')], 'sess1');
    expect(state.greenCount).toBe(1);
    expect(state.cardStatuses.get(1)).toBe('memorised');
  });

  it('Marking a card missed makes it red', () => {
    const state = deriveSessionState([1, 2, 3], [makeEvent(1, 'missed')], 'sess1');
    expect(state.redCount).toBe(1);
    expect(state.cardStatuses.get(1)).toBe('missed');
  });

  it('Re-marking a missed card as memorised changes it to green (FR-11)', () => {
    const state = deriveSessionState(
      [1],
      [makeEvent(1, 'missed', 'sess1', 1), makeEvent(1, 'memorised', 'sess1', 2)],
      'sess1',
    );
    expect(state.greenCount).toBe(1);
    expect(state.cardStatuses.get(1)).toBe('memorised');
  });

  it('Re-marking a memorised card as missed changes it to red (FR-11)', () => {
    const state = deriveSessionState(
      [1],
      [makeEvent(1, 'memorised', 'sess1', 1), makeEvent(1, 'missed', 'sess1', 2)],
      'sess1',
    );
    expect(state.redCount).toBe(1);
    expect(state.cardStatuses.get(1)).toBe('missed');
  });

  it('Latest event wins when multiple events exist for same card', () => {
    const state = deriveSessionState(
      [1],
      [makeEvent(1, 'missed', 'sess1', 2), makeEvent(1, 'memorised', 'sess1', 1)],
      'sess1',
    );
    // missed at offset=2 is later, so it wins
    expect(state.cardStatuses.get(1)).toBe('missed');
  });

  it('Events from a different sessionId are ignored', () => {
    const state = deriveSessionState([1], [makeEvent(1, 'memorised', 'sess2')], 'sess1');
    expect(state.unratedCount).toBe(1);
    expect(state.cardStatuses.get(1)).toBe('unrated');
  });

  it('Session is complete only when ALL cards are green', () => {
    let state = deriveSessionState(
      [1, 2],
      [makeEvent(1, 'memorised'), makeEvent(2, 'missed')],
      'sess1',
    );
    expect(isSessionComplete(state)).toBe(false);
    state = deriveSessionState(
      [1, 2],
      [makeEvent(1, 'memorised'), makeEvent(2, 'memorised')],
      'sess1',
    );
    expect(isSessionComplete(state)).toBe(true);
  });

  it('Unrated cards block completion', () => {
    const state = deriveSessionState([1, 2], [makeEvent(1, 'memorised')], 'sess1');
    expect(isSessionComplete(state)).toBe(false);
  });

  it('buildOrderedCardList: maintains deck order regardless of missed status', () => {
    const state = deriveSessionState([1, 2, 3], [makeEvent(1, 'missed')], 'sess1');
    const deck = [mockWord(1), mockWord(2), mockWord(3)];
    const list = buildOrderedCardList(deck, state.cardStatuses);
    expect(list).toEqual([1, 2, 3]);
  });

  it("buildSessionDeck with 'series' returns sorted by day then id", () => {
    const words = [mockWord(2, 2), mockWord(1, 2), mockWord(3, 1)];
    const deck = buildSessionDeck(words, 'series', 123);
    expect(deck.map((w) => w.id)).toEqual([3, 1, 2]);
  });

  it("buildSessionDeck with 'shuffled' and same seed gives same result", () => {
    const words = [mockWord(1), mockWord(2), mockWord(3)];
    const deck1 = buildSessionDeck(words, 'shuffled', 123);
    const deck2 = buildSessionDeck(words, 'shuffled', 123);
    expect(deck1.map((w) => w.id)).toEqual(deck2.map((w) => w.id));
  });

  it('Toggling from series to shuffled gives different order', () => {
    const words = [mockWord(1), mockWord(2), mockWord(3), mockWord(4)];
    const seriesDeck = buildSessionDeck(words, 'series', 999);
    const shuffledDeck = buildSessionDeck(words, 'shuffled', 999);
    // With 4 elements and most seeds, order will differ
    expect(seriesDeck.map((w) => w.id)).not.toEqual(shuffledDeck.map((w) => w.id));
  });

  it('nextCardIndex: clamps at boundaries', () => {
    const list = [1, 2, 3];
    expect(nextCardIndex(list, 0, 'prev')).toBe(0);  // can't go before first
    expect(nextCardIndex(list, 2, 'next')).toBe(2);  // can't go past last
    expect(nextCardIndex(list, 1, 'next')).toBe(2);
    expect(nextCardIndex(list, 1, 'prev')).toBe(0);
  });

  it('getMissedWordIds returns only red cards', () => {
    const state = deriveSessionState(
      [1, 2, 3],
      [makeEvent(1, 'missed'), makeEvent(2, 'memorised')],
      'sess1',
    );
    expect(getMissedWordIds(state)).toEqual([1]);
  });

  it('Duplicate events (same eventId) are handled idempotently by deriveSessionState', () => {
    const evt = makeEvent(1, 'missed', 'sess1', 1);
    const state = deriveSessionState([1], [evt, evt], 'sess1');
    expect(state.redCount).toBe(1);
    expect(state.cardStatuses.get(1)).toBe('missed');
  });
});


describe('coveredDays', () => {
  it('returns empty set for no sessions', () => {
    expect(coveredDays([])).toEqual(new Set());
  });

  it('includes days from a completed session', () => {
    const s = { completedAt: '2024-01-01', scope: { startDay: 2, endDay: 4 } } as any;
    const days = coveredDays([s]);
    expect(days.has(2)).toBe(true);
    expect(days.has(3)).toBe(true);
    expect(days.has(4)).toBe(true);
    expect(days.has(5)).toBe(false);
    expect(days.size).toBe(3);
  });

  it('ignores incomplete sessions', () => {
    const s = { completedAt: null, scope: { startDay: 1, endDay: 3 } } as any;
    expect(coveredDays([s]).size).toBe(0);
  });

  it('handles overlapping scopes', () => {
    const s1 = { completedAt: 'time', scope: { startDay: 1, endDay: 3 } } as any;
    const s2 = { completedAt: 'time', scope: { startDay: 2, endDay: 5 } } as any;
    const days = coveredDays([s1, s2]);
    expect(days.size).toBe(5);
    expect(Array.from(days).sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('can cover all 34 days', () => {
    const s = { completedAt: 'time', scope: { startDay: 1, endDay: 34 } } as any;
    expect(coveredDays([s]).size).toBe(34);
  });
});
