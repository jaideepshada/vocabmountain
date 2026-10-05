import { Word, Deck } from './types';

export function validateDeck(data: unknown): Word[] {
  if (!Array.isArray(data)) {
    throw new Error('Deck must be an array');
  }
  if (data.length !== 1020) {
    throw new Error(`Deck must have exactly 1020 words, got ${data.length}`);
  }

  const ids = new Set<number>();
  const dayCounts = new Map<number, number>();

  for (const item of data) {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Word must be an object');
    }
    const word = item as Word;
    
    if (typeof word.id !== 'number') throw new Error('Word id must be a number');
    if (typeof word.day !== 'number') throw new Error('Word day must be a number');
    if (typeof word.word !== 'string') throw new Error('Word word must be a string');
    if (typeof word.partOfSpeech !== 'string') throw new Error('Word partOfSpeech must be a string');
    
    if (ids.has(word.id)) throw new Error(`Duplicate word id: ${word.id}`);
    ids.add(word.id);

    if (word.day < 1 || word.day > 34) throw new Error(`Invalid day: ${word.day}`);
    dayCounts.set(word.day, (dayCounts.get(word.day) || 0) + 1);

    if (!Array.isArray(word.senses) || word.senses.length === 0) {
      throw new Error(`Word ${word.word} must have at least one sense`);
    }

    for (const sense of word.senses) {
      if (typeof sense.definition !== 'string') throw new Error('Sense definition must be a string');
      if (typeof sense.example !== 'string') throw new Error('Sense example must be a string');
      if (!Array.isArray(sense.synonyms) || !sense.synonyms.every((s: unknown) => typeof s === 'string')) {
        throw new Error('Sense synonyms must be an array of strings');
      }
    }
  }

  for (let day = 1; day <= 34; day++) {
    if (dayCounts.get(day) !== 30) {
      throw new Error(`Day ${day} must have exactly 30 words`);
    }
  }

  return data as Word[];
}

export function getWordsForDays(deck: Deck, startDay: number, endDay: number): Word[] {
  return deck
    .filter(word => word.day >= startDay && word.day <= endDay)
    .sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return a.id - b.id;
    });
}

export function getWordById(deck: Deck, wordId: number): Word | undefined {
  return deck.find(word => word.id === wordId);
}
