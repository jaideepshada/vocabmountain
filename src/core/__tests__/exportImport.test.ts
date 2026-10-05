import { describe, it, expect } from 'vitest';
import { serializeProgress, validateImportData, deserializeProgress } from '../exportImport';
import type { ReviewEvent, Session } from '../types';

function createMockEvent(): ReviewEvent {
  return { eventId: 'evt1', wordId: 1, result: 'memorised', reviewedAt: '2024-01-01T00:00:00.000Z', sessionId: 'sess1', sessionType: 'normal' };
}

function createMockSession(): Session {
  return { sessionId: 'sess1', scope: { kind: 'single', startDay: 1, endDay: 1 }, sessionType: 'normal', orderMode: 'series', shuffleSeed: 123, createdAt: '2024-01-01T00:00:00.000Z', completedAt: null, wordIds: [1] };
}

describe('exportImport', () => {
  it('serializeProgress produces valid JSON with version 1', () => {
    const json = serializeProgress([createMockEvent()], [createMockSession()]);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.events.length).toBe(1);
    expect(parsed.sessions.length).toBe(1);
  });

  it('deserializeProgress round-trips correctly', () => {
    const originalJson = serializeProgress([createMockEvent()], [createMockSession()]);
    const parsed = deserializeProgress(originalJson);
    expect(parsed.events.length).toBe(1);
    expect(parsed.sessions.length).toBe(1);
  });

  it('validateImportData rejects missing version', () => {
    const data = { exportedAt: '2024-01-01', events: [], sessions: [] };
    expect(() => validateImportData(data)).toThrow();
  });

  it('validateImportData rejects wrong version', () => {
    const data = { version: 2, exportedAt: '2024-01-01', events: [], sessions: [] };
    expect(() => validateImportData(data)).toThrow();
  });

  it('validateImportData rejects non-object', () => {
    expect(() => validateImportData(null)).toThrow();
    expect(() => validateImportData('string')).toThrow();
  });

  it('validateImportData rejects too many events (> 100_000)', () => {
    const events = Array.from({ length: 100001 }, () => createMockEvent());
    const data = { version: 1 as const, exportedAt: '2024-01-01', events, sessions: [] };
    expect(() => validateImportData(data)).toThrow();
  });

  it('validateImportData rejects events with invalid result', () => {
    const event = { ...createMockEvent(), result: 'invalid' };
    const data = { version: 1 as const, exportedAt: '2024-01-01', events: [event as any], sessions: [] };
    expect(() => validateImportData(data)).toThrow();
  });

  it('deserializeProgress rejects invalid JSON string', () => {
    expect(() => deserializeProgress('invalid json')).toThrow();
  });
});
