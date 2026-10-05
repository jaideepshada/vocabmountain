import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  Word,
  Deck,
  ReviewEvent,
  Session,
  SessionScope,
  OrderMode,
  CardStatus,
  DerivedSessionState,
} from '../core/types';
import { deriveSessionState, buildSessionDeck, buildOrderedCardList, getMissedWordIds } from '../core/session';
import { getWordsForDays } from '../core/deck';
import {
  addReviewEvent,
  saveSession,
  getActiveSession,
  completeSession,
  deleteSession,
} from '../db/database';
import { useActiveSession, useSessionEvents } from '../db/hooks';

interface UseStudySessionReturn {
  /** Current session, if any. */
  readonly session: Session | null | undefined;
  /** Current card being studied. */
  readonly currentCard: Word | undefined;
  /** Index into the ordered card list. */
  readonly currentIndex: number;
  /** Total cards in the ordered list. */
  readonly totalCards: number;
  /** Whether the card is flipped (showing back). */
  readonly isFlipped: boolean;
  /** Derived state with statuses and counts. */
  readonly state: DerivedSessionState | null;
  /** Status of the current card. */
  readonly currentCardStatus: CardStatus;
  /** The ordered word IDs (with missed at end). */
  readonly orderedWordIds: readonly number[];
  /** Current order mode. */
  readonly orderMode: OrderMode;

  // Actions
  readonly flipCard: () => void;
  readonly goNext: () => void;
  readonly goPrev: () => void;
  readonly markMemorise: () => void;
  readonly markMissed: () => void;
  readonly toggleOrder: () => void;
  readonly restartSession: () => void;
  readonly replayMissed: () => void;
  readonly endSession: () => void;
  readonly startSession: (scope: SessionScope) => void;
}

export function useStudySession(deck: Deck): UseStudySessionReturn {
  const activeSession = useActiveSession();
  const sessionEvents = useSessionEvents(activeSession?.sessionId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [localOrderMode, setLocalOrderMode] = useState<OrderMode>('series');
  const [localSeed, setLocalSeed] = useState(0);
  const [sessionWordIds, setSessionWordIds] = useState<readonly number[]>([]);

  // Track session ID to detect changes
  const prevSessionId = useRef<string | undefined>(undefined);

  // When session changes, sync local state
  useEffect(() => {
    if (activeSession && activeSession.sessionId !== prevSessionId.current) {
      prevSessionId.current = activeSession.sessionId;
      setLocalOrderMode(activeSession.orderMode);
      setLocalSeed(activeSession.shuffleSeed);
      setSessionWordIds(activeSession.wordIds);
      setCurrentIndex(0);
      setIsFlipped(false);
    } else if (!activeSession) {
      prevSessionId.current = undefined;
    }
  }, [activeSession]);

  // Build the session words from the deck
  const sessionWords = useMemo(() => {
    if (!activeSession || sessionWordIds.length === 0) return [];
    const wordSet = new Set(sessionWordIds);
    return deck.filter((w) => wordSet.has(w.id));
  }, [deck, sessionWordIds, activeSession]);

  // Build ordered deck (series or shuffled)
  const orderedDeck = useMemo(() => {
    if (sessionWords.length === 0) return [];
    return buildSessionDeck(sessionWords, localOrderMode, localSeed);
  }, [sessionWords, localOrderMode, localSeed]);

  // Derive session state from events
  const state = useMemo(() => {
    if (!activeSession || sessionWordIds.length === 0) return null;
    return deriveSessionState(
      sessionWordIds,
      sessionEvents,
      activeSession.sessionId,
    );
  }, [activeSession, sessionWordIds, sessionEvents]);

  // Build the ordered card list (with missed at end)
  const orderedWordIds = useMemo(() => {
    if (!state || orderedDeck.length === 0) return [];
    return buildOrderedCardList(orderedDeck, state.cardStatuses);
  }, [orderedDeck, state]);

  // Get current card
  const currentWordId = orderedWordIds[currentIndex];
  const currentCard = useMemo(() => {
    if (currentWordId === undefined) return undefined;
    return deck.find((w) => w.id === currentWordId);
  }, [deck, currentWordId]);

  const currentCardStatus = useMemo(() => {
    if (!state || currentWordId === undefined) return 'unrated' as CardStatus;
    return state.cardStatuses.get(currentWordId) ?? 'unrated';
  }, [state, currentWordId]);

  // Check for session completion
  useEffect(() => {
    if (state?.isComplete && activeSession && !activeSession.completedAt) {
      completeSession(activeSession.sessionId).catch(console.error);
    }
  }, [state?.isComplete, activeSession]);

  const flipCard = useCallback(() => {
    setIsFlipped((f) => !f);
  }, []);

  const goNext = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((i) => {
      if (i < orderedWordIds.length - 1) return i + 1;
      
      // If we are at the end, but session is not complete, wrap around to first non-green card
      if (state && !state.isComplete) {
        const next = orderedWordIds.findIndex((id) => state.cardStatuses.get(id) !== 'memorised');
        if (next !== -1) return next;
      }
      return i;
    });
  }, [orderedWordIds, state]);

  const goPrev = useCallback(() => {
    setIsFlipped(false);
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const markCard = useCallback(
    async (result: 'memorised' | 'missed') => {
      if (!activeSession || currentWordId === undefined) return;

      const event: ReviewEvent = {
        eventId: uuidv4(),
        wordId: currentWordId,
        result,
        reviewedAt: new Date().toISOString(),
        sessionId: activeSession.sessionId,
        sessionType: activeSession.sessionType,
      };

      await addReviewEvent(event);
    },
    [activeSession, currentWordId],
  );

  const markMemorise = useCallback(() => {
    markCard('memorised').catch(console.error);
  }, [markCard]);

  const markMissed = useCallback(() => {
    markCard('missed').catch(console.error);
  }, [markCard]);

  const toggleOrder = useCallback(async () => {
    if (!activeSession) return;
    const newMode: OrderMode = localOrderMode === 'series' ? 'shuffled' : 'series';
    setLocalOrderMode(newMode);
    setCurrentIndex(0);
    setIsFlipped(false);

    // Persist the new order mode
    const updated: Session = { ...activeSession, orderMode: newMode };
    await saveSession(updated);
  }, [activeSession, localOrderMode]);

  const restartSession = useCallback(async () => {
    if (!activeSession) return;

    // Create a new session with the same scope, resetting all events
    const newSession: Session = {
      sessionId: uuidv4(),
      scope: activeSession.scope,
      sessionType: 'normal',
      orderMode: localOrderMode,
      shuffleSeed: localOrderMode === 'shuffled' ? Math.floor(Math.random() * 2147483647) : activeSession.shuffleSeed,
      createdAt: new Date().toISOString(),
      completedAt: null,
      wordIds: activeSession.wordIds,
    };

    // End old session (delete it) and start new one
    await deleteSession(activeSession.sessionId);
    await saveSession(newSession);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeSession, localOrderMode]);

  const replayMissed = useCallback(async () => {
    if (!activeSession || !state) return;

    const missedIds = getMissedWordIds(state);
    if (missedIds.length === 0) return;

    // Create a new replay_missed session with only missed cards
    const newSession: Session = {
      sessionId: uuidv4(),
      scope: activeSession.scope,
      sessionType: 'replay_missed',
      orderMode: localOrderMode,
      shuffleSeed: localOrderMode === 'shuffled' ? Math.floor(Math.random() * 2147483647) : activeSession.shuffleSeed,
      createdAt: new Date().toISOString(),
      completedAt: null,
      wordIds: missedIds,
    };

    await deleteSession(activeSession.sessionId);
    await saveSession(newSession);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [activeSession, state, localOrderMode]);

  const endSession = useCallback(async () => {
    if (!activeSession) return;
    await deleteSession(activeSession.sessionId);
  }, [activeSession]);

  const startSession = useCallback(
    async (scope: SessionScope) => {
      // Check if there's already an active session
      const existing = await getActiveSession();
      if (existing) return;

      const words = getWordsForDays(deck, scope.startDay, scope.endDay);
      const seed = Math.floor(Math.random() * 2147483647);

      const session: Session = {
        sessionId: uuidv4(),
        scope,
        sessionType: 'normal',
        orderMode: 'series',
        shuffleSeed: seed,
        createdAt: new Date().toISOString(),
        completedAt: null,
        wordIds: words.map((w) => w.id),
      };

      await saveSession(session);
      setCurrentIndex(0);
      setIsFlipped(false);
      setLocalOrderMode('series');
      setLocalSeed(seed);
      setSessionWordIds(session.wordIds);
    },
    [deck],
  );

  return {
    session: activeSession,
    currentCard,
    currentIndex,
    totalCards: orderedWordIds.length,
    isFlipped,
    state,
    currentCardStatus,
    orderedWordIds,
    orderMode: localOrderMode,
    flipCard,
    goNext,
    goPrev,
    markMemorise,
    markMissed,
    toggleOrder,
    restartSession,
    replayMissed,
    endSession,
    startSession,
  };
}
