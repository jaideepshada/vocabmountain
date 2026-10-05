import { ExportData, ReviewEvent, Session } from './types';

export function serializeProgress(events: readonly ReviewEvent[], sessions: readonly Session[]): string {
  const data: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    events,
    sessions,
  };
  return JSON.stringify(data);
}

export function validateImportData(raw: unknown): ExportData {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Import data must be an object');
  }
  const data = raw as any;

  if (data.version !== 1) {
    throw new Error(`Unsupported version: ${data.version}`);
  }
  if (typeof data.exportedAt !== 'string') {
    throw new Error('exportedAt must be a string');
  }

  if (!Array.isArray(data.events)) {
    throw new Error('events must be an array');
  }
  if (data.events.length > 100_000) {
    throw new Error('Too many events (max 100,000)');
  }

  for (const event of data.events) {
    if (typeof event.eventId !== 'string') throw new Error('eventId must be a string');
    if (typeof event.wordId !== 'number') throw new Error('wordId must be a number');
    if (event.result !== 'memorised' && event.result !== 'missed') {
      throw new Error(`Invalid event result: ${event.result}`);
    }
    if (typeof event.reviewedAt !== 'string') throw new Error('reviewedAt must be a string');
    if (typeof event.sessionId !== 'string') throw new Error('sessionId must be a string');
    if (typeof event.sessionType !== 'string') throw new Error('sessionType must be a string');
  }

  if (!Array.isArray(data.sessions)) {
    throw new Error('sessions must be an array');
  }

  for (const session of data.sessions) {
    if (typeof session.sessionId !== 'string') throw new Error('sessionId must be a string');
    if (typeof session.scope !== 'object' || session.scope === null) throw new Error('scope must be an object');
    if (typeof session.sessionType !== 'string') throw new Error('sessionType must be a string');
    if (session.orderMode !== 'series' && session.orderMode !== 'shuffled') {
      throw new Error(`Invalid orderMode: ${session.orderMode}`);
    }
    if (typeof session.shuffleSeed !== 'number') throw new Error('shuffleSeed must be a number');
    if (typeof session.createdAt !== 'string') throw new Error('createdAt must be a string');
    if (session.completedAt !== null && typeof session.completedAt !== 'string') {
      throw new Error('completedAt must be a string or null');
    }
    if (!Array.isArray(session.wordIds) || !session.wordIds.every((id: unknown) => typeof id === 'number')) {
      throw new Error('wordIds must be an array of numbers');
    }
  }

  return data as ExportData;
}

export function deserializeProgress(json: string): ExportData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
  return validateImportData(parsed);
}
