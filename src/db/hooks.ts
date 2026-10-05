import { useLiveQuery } from 'dexie-react-hooks';
import { db, getActiveSession, getSessionEvents, getAllEvents, getAllSessions } from './database';
import type { ReviewEvent, Session } from '../core/types';

export function useActiveSession(): Session | null | undefined {
  return useLiveQuery(async () => {
    const session = await getActiveSession();
    return session ?? null;
  });
}

export function useSessionEvents(sessionId: string | undefined): ReviewEvent[] {
  return useLiveQuery(
    async () => {
      if (!sessionId) return [];
      return await getSessionEvents(sessionId);
    },
    [sessionId]
  ) ?? [];
}

export function useAllEvents(): ReviewEvent[] {
  return useLiveQuery(() => getAllEvents(), []) ?? [];
}

export function useAllSessions(): Session[] {
  return useLiveQuery(() => getAllSessions(), []) ?? [];
}

export function useSetting(key: string): string | undefined {
  return useLiveQuery(
    async () => {
      const setting = await db.settings.get(key);
      return setting?.value;
    },
    [key]
  ) ?? undefined;
}
