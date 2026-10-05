import Dexie, { type EntityTable } from 'dexie';
import type { ReviewEvent, Session } from '../core/types';

interface Setting {
  key: string;
  value: string;
  updatedAt: string;
}

export class VocabMountainDB extends Dexie {
  reviewEvents!: EntityTable<ReviewEvent, 'eventId'>;
  sessions!: EntityTable<Session, 'sessionId'>;
  settings!: EntityTable<Setting, 'key'>;

  constructor() {
    super('VocabMountainDB');
    this.version(1).stores({
      reviewEvents: 'eventId, sessionId, wordId, reviewedAt',
      sessions: 'sessionId, createdAt',
      settings: 'key'
    });
  }
}

export const db = new VocabMountainDB();

export async function addReviewEvent(event: ReviewEvent): Promise<void> {
  await db.reviewEvents.put(event);
}

export async function getSessionEvents(sessionId: string): Promise<ReviewEvent[]> {
  const events = await db.reviewEvents.where('sessionId').equals(sessionId).toArray();
  return events.sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
}

export async function getAllEvents(): Promise<ReviewEvent[]> {
  const events = await db.reviewEvents.toArray();
  return events.sort((a, b) => a.reviewedAt.localeCompare(b.reviewedAt));
}

export async function saveSession(session: Session): Promise<void> {
  await db.sessions.put(session);
}

export async function getSession(sessionId: string): Promise<Session | undefined> {
  return await db.sessions.get(sessionId);
}

export async function getActiveSession(): Promise<Session | undefined> {
  const sessions = await db.sessions.toArray();
  const activeSessions = sessions.filter(s => s.completedAt === null);
  if (activeSessions.length === 0) return undefined;
  
  activeSessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return activeSessions[0];
}

export async function getAllSessions(): Promise<Session[]> {
  return await db.sessions.toArray();
}

export async function completeSession(sessionId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (session) {
    const updated = { ...session, completedAt: new Date().toISOString() };
    await db.sessions.put(updated);
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await db.transaction('rw', db.sessions, db.reviewEvents, async () => {
    await db.sessions.delete(sessionId);
    const events = await db.reviewEvents.where('sessionId').equals(sessionId).toArray();
    const eventIds = events.map(e => e.eventId);
    await db.reviewEvents.bulkDelete(eventIds);
  });
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.sessions, db.reviewEvents, db.settings, async () => {
    await db.sessions.clear();
    await db.reviewEvents.clear();
    await db.settings.clear();
  });
}

export async function importData(events: readonly ReviewEvent[], sessions: readonly Session[]): Promise<void> {
  await db.transaction('rw', db.sessions, db.reviewEvents, async () => {
    await db.sessions.bulkPut(sessions as Session[]);
    await db.reviewEvents.bulkPut(events as ReviewEvent[]);
  });
}

export async function getSetting(key: string): Promise<string | undefined> {
  const setting = await db.settings.get(key);
  return setting?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({
    key,
    value,
    updatedAt: new Date().toISOString()
  });
}
