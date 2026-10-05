import { ReviewEvent, DerivedSessionState, Word, OrderMode, CardStatus } from './types';
import { seededShuffle } from './shuffle';

export function deriveSessionState(wordIds: readonly number[], events: readonly ReviewEvent[], sessionId: string): DerivedSessionState {
  const sessionEvents = events.filter(e => e.sessionId === sessionId);
  const sortedEvents = [...sessionEvents].sort((a, b) => new Date(a.reviewedAt).getTime() - new Date(b.reviewedAt).getTime());
  
  const statusMap = new Map<number, CardStatus>();
  for (const id of wordIds) {
    statusMap.set(id, 'unrated');
  }

  for (const event of sortedEvents) {
    if (statusMap.has(event.wordId)) {
      statusMap.set(event.wordId, event.result);
    }
  }

  let greenCount = 0;
  let redCount = 0;
  let unratedCount = 0;

  for (const status of statusMap.values()) {
    if (status === 'memorised') greenCount++;
    else if (status === 'missed') redCount++;
    else if (status === 'unrated') unratedCount++;
  }

  return {
    cardStatuses: statusMap,
    greenCount,
    redCount,
    unratedCount,
    totalCount: wordIds.length,
    isComplete: wordIds.length > 0 && greenCount === wordIds.length,
  };
}

export function buildSessionDeck(words: readonly Word[], orderMode: OrderMode, seed: number): Word[] {
  if (orderMode === 'series') {
    return [...words].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.id - b.id;
    });
  }
  return seededShuffle(words, seed);
}

export function buildOrderedCardList(deck: readonly Word[], _cardStatuses: ReadonlyMap<number, CardStatus>): number[] {
  return deck.map(w => w.id);
}

export function nextCardIndex(orderedIds: readonly number[], currentIndex: number, direction: 'next' | 'prev'): number {
  if (orderedIds.length === 0) return 0;
  if (direction === 'next') {
    return Math.min(currentIndex + 1, orderedIds.length - 1);
  } else {
    return Math.max(currentIndex - 1, 0);
  }
}

export function isSessionComplete(state: DerivedSessionState): boolean {
  return state.isComplete;
}

export function getMissedWordIds(state: DerivedSessionState): number[] {
  const missed: number[] = [];
  for (const [id, status] of state.cardStatuses.entries()) {
    if (status === 'missed') {
      missed.push(id);
    }
  }
  return missed;
}
