import { supabase } from '../core/supabase';
import { db, getAllEvents, getAllSessions } from './database';
import type { ReviewEvent, Session } from '../core/types';

export async function syncDatabase(): Promise<{ success: boolean; message?: string }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error('You must be logged in to sync.');
    }
    const userId = authData.user.id;

    // 1. PULL from Supabase
    const { data: remoteSessions, error: rsError } = await supabase
      .from('sessions')
      .select('*');
    
    const { data: remoteEvents, error: reError } = await supabase
      .from('review_events')
      .select('*');

    if (rsError) throw rsError;
    if (reError) throw reError;

    // Convert Supabase rows back to local types
    const parsedSessions: Session[] = (remoteSessions || []).map((row) => ({
      sessionId: row.id,
      scope: row.scope,
      sessionType: row.session_type,
      orderMode: row.order_mode,
      shuffleSeed: row.shuffle_seed,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      wordIds: row.word_ids,
    }));

    const parsedEvents: ReviewEvent[] = (remoteEvents || []).map((row) => ({
      eventId: row.id,
      wordId: row.word_id,
      result: row.result as any,
      reviewedAt: row.reviewed_at,
      sessionId: row.session_id,
      sessionType: row.session_type as any,
    }));

    // Put remote data into local Dexie (this merges/overwrites gracefully)
    if (parsedSessions.length > 0) await db.sessions.bulkPut(parsedSessions);
    if (parsedEvents.length > 0) await db.reviewEvents.bulkPut(parsedEvents);

    // 2. PUSH to Supabase
    const localSessions = await getAllSessions();
    const localEvents = await getAllEvents();

    const pushSessions = localSessions.map(s => ({
      id: s.sessionId,
      user_id: userId,
      scope: s.scope,
      session_type: s.sessionType,
      order_mode: s.orderMode,
      shuffle_seed: s.shuffleSeed,
      created_at: s.createdAt,
      completed_at: s.completedAt,
      word_ids: s.wordIds
    }));

    const pushEvents = localEvents.map(e => ({
      id: e.eventId,
      user_id: userId,
      word_id: e.wordId,
      result: e.result,
      reviewed_at: e.reviewedAt,
      session_id: e.sessionId,
      session_type: e.sessionType
    }));

    // Upsert to Supabase
    if (pushSessions.length > 0) {
      const { error: pushSErr } = await supabase.from('sessions').upsert(pushSessions);
      if (pushSErr) throw pushSErr;
    }

    if (pushEvents.length > 0) {
      // Chunking events just in case there are thousands
      const chunkSize = 1000;
      for (let i = 0; i < pushEvents.length; i += chunkSize) {
        const chunk = pushEvents.slice(i, i + chunkSize);
        const { error: pushEErr } = await supabase.from('review_events').upsert(chunk);
        if (pushEErr) throw pushEErr;
      }
    }

    return { success: true };
  } catch (error: any) {
    console.error('Sync failed:', error);
    return { success: false, message: error.message || 'Unknown sync error' };
  }
}
