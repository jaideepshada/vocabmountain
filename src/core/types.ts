// ────────────────────────────────────────────────────────────
// Vocab Mountain — Core Types
// All domain types live here. No UI or storage imports.
// ────────────────────────────────────────────────────────────

/** A single word sense with definition, example, and synonyms. */
export interface Sense {
  readonly definition: string;
  readonly example: string;
  readonly synonyms: readonly string[];
}

/** A single word entry from the deck. */
export interface Word {
  readonly id: number;
  readonly day: number;
  readonly word: string;
  readonly partOfSpeech: string;
  readonly senses: readonly Sense[];
}

/** The full 1,020-word deck. */
export type Deck = readonly Word[];

/** Card marking result. */
export type MarkResult = 'memorised' | 'missed';

/** Card status in a session: unrated, memorised (green), or missed (red). */
export type CardStatus = 'unrated' | 'memorised' | 'missed';

/** Session type identifier. */
export type SessionType = 'normal' | 'replay_missed';

/** The scope of days chosen for a session. */
export interface SessionScope {
  /** 'single' = one day, 'range' = contiguous range, 'all' = all 34 days. */
  readonly kind: 'single' | 'range' | 'all';
  /** Start day (inclusive). For 'all', this is 1. */
  readonly startDay: number;
  /** End day (inclusive). For 'single', same as startDay. For 'all', 34. */
  readonly endDay: number;
}

/** Card ordering mode. */
export type OrderMode = 'series' | 'shuffled';

/** A single review event (append-only log entry). */
export interface ReviewEvent {
  readonly eventId: string;
  readonly wordId: number;
  readonly result: MarkResult;
  readonly reviewedAt: string; // ISO 8601 timestamp
  readonly sessionId: string;
  readonly sessionType: SessionType;
}

/** Persisted session record. */
export interface Session {
  readonly sessionId: string;
  readonly scope: SessionScope;
  readonly sessionType: SessionType;
  readonly orderMode: OrderMode;
  readonly shuffleSeed: number;
  readonly createdAt: string; // ISO 8601
  readonly completedAt: string | null; // ISO 8601 or null if active
  /** Word IDs in this session (for replay_missed, only the missed subset). */
  readonly wordIds: readonly number[];
}

/** Derived state of a single card within a session. */
export interface CardState {
  readonly wordId: number;
  readonly status: CardStatus;
}

/** Fully derived session state. */
export interface DerivedSessionState {
  /** Map of wordId → CardStatus. */
  readonly cardStatuses: ReadonlyMap<number, CardStatus>;
  /** Number of cards rated green. */
  readonly greenCount: number;
  /** Number of cards rated red. */
  readonly redCount: number;
  /** Number of unrated cards. */
  readonly unratedCount: number;
  /** Total cards in session. */
  readonly totalCount: number;
  /** Whether session is complete (all green). */
  readonly isComplete: boolean;
}

/** App settings (persisted). */
export interface AppSettings {
  readonly updatedAt: string; // ISO 8601
}

/** Export/import data format. */
export interface ExportData {
  readonly version: 1;
  readonly exportedAt: string;
  readonly events: readonly ReviewEvent[];
  readonly sessions: readonly Session[];
}
