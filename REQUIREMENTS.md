# GRE Vocab Mountain: Requirements v1

## 1. Goal
Memorize 1,020 GRE words (34 days x 30) to **recognition level**: see the word, recall the meaning. Study from phone, laptop and iPad with progress shared across all three.

## 2. Scope
**In v1:** flip cards, green/red self-marking, cumulative day pile, missing basket, progress views, cross-device sync, offline use.
**Out of v1 (v2 candidates):** typed-answer quizzes, sentence-completion questions, audio pronunciation, multiple users or sharing, reverse (meaning to word) cards.

## 3. Assumptions to confirm
- A1. (Resolved) Days are just 30-word groups the user selects manually; nothing is locked or auto-advanced, and days are not tied to calendar dates.
- A2. Single user (you). Auth exists only to protect and sync your data.
- A3. (Confirmed) The deck is static and ships with the app; words are not editable in-app. Only progress is stored remotely.

## 4. Functional requirements

### 4.1 Deck
- FR-1. Deck is a structured JSON parsed once from the PDF (`words.json`), validated: 1,020 entries, 30 per day, no duplicates.
- FR-2. Each entry: `id`, `day`, `word`, `partOfSpeech`, `senses[]` (each: `definition`, `example`, `synonyms[]`). Single-sense words have one sense. Synonyms may be empty (e.g. *misnomer*).

### 4.2 Study session
- FR-3. Card front shows the word only. Flip reveals part of speech, all senses with examples, and synonyms.
- FR-4. User marks each card **Memorised** (card turns green) or **Missed** (card turns red).
- FR-5. Keyboard: Space = flip, Left/Right = move to previous/next card in the deck, Up = Memorised (green), Down = Missed (red). On touch: tap to flip, swipe left/right to navigate, on-screen buttons to rate.
- FR-6. A session contains the cards from a **user-chosen scope of days** (e.g. Day 1 only, Days 1-3, Days 5-9, or all 34), every card starting **unrated**. Scope is chosen manually before each session; there is no automatic day progression. Colors never carry over between sessions; each session is independent. A session is complete when every card in it is green.
- FR-7. (Removed: the full cumulative pile is now the default, so no separate Review Everything mode.)
- FR-8. A button toggles card order between **Series** (fixed deck order, Day then word number) and **Shuffled**, available at any time during a session. Toggling restarts the deck from the **first card of the new order**; card colors (green/red) are untouched. A missed (red) card is placed **after all the other cards of the session's deck**, and keeps cycling to the end of the deck until it is marked Memorised. The session ends only when every card in it is green. (Confirmed.)
- FR-9. **Session setup**: user picks the day scope (single day, contiguous range, or all) and starts a session. Any day is accessible at any time, whether or not earlier days were studied. **Only one active session exists at a time**: a new one cannot be started until the current one is complete (every card green). Start screen shows the chosen scope and card count and asks for confirmation, because scope cannot be changed once started (Restart keeps the same scope).
- FR-9e. **Library / browse mode**: view every card of any day, flip freely, with no marking and no session effects.
- FR-9a. **Restart session** (replay whole pile / reset): restart the current session's full pile with every card unrated. Earlier marks stay in the log but no longer affect the current colors. Replaces the former separate Reset-day feature.
- FR-9b. **Replay missed**: build a pile from only the cards currently rated Missed in this session and run it.
- FR-9c. (Merged into FR-9a: with independent sessions, reset and replay-all are the same operation.)
- FR-9d. **Resume**: an unfinished session can be resumed on any device, with the same card colors, by replaying that session's events.

### 4.3 Card status (no mastery tracking)
- FR-10. A card's status is simply its **latest mark within the current session**: green (memorised), red (missed) or unrated. All cards reset to unrated when a new session starts. There is no mastery threshold, streak rule or K setting.
- FR-10a. Navigating (Left/Right) or flipping never changes a card's status. A card is red only if the user explicitly marks it with Down; skipping a card leaves it unrated. The first passes through a session are expected to be memorisation passes with no marking.
- FR-11. Re-marking a card changes its color. Every mark is still logged as an event; the latest event decides the color.

### 4.4 Progress and motivation
- FR-12. Day map (1-34) showing started, completed and current days.
- FR-13. Missing basket view: in a session, all cards currently red; across sessions, words ranked by lifetime miss count (from the event log).
- FR-14. Mountain progress bar: sessions completed, and which days have been included in at least one completed session (out of 34).
- FR-15. Streak counter and session summary (right, missed, duration).
- FR-16. Search: look up any word and see its card plus its personal history (times seen, misses).

### 4.5 Sync and accounts
- FR-17. Sign in (email magic link or Google). One account, same data on all devices.
- FR-18. All reviews work **offline** and sync automatically when connectivity returns.
- FR-19. Export and import progress as a JSON backup.

## 5. Sync and data model (the key design decision)

**Rule: store events, derive state.** Do not store "current status" as the source of truth, because two offline devices will overwrite each other.

`review_events` (append-only, one row per rating):
`event_id (client-generated UUID)`, `user_id`, `word_id`, `result (memorised|missed)`, `reviewed_at (device timestamp)`, `device_id`, `study_day`, `session_id`, `session_type (normal|replay_all|replay_missed)`.

The log is strictly append-only: nothing is ever deleted or voided. Reset day only recomputes the pile and writes no events.

- Sync = union of events from all devices, deduplicated by `event_id` (makes retries idempotent).
- Per-session word state (current color, miss count in that session) is derived by replaying that session's events; lifetime miss counts are derived from all events. State is **recomputed by replaying events in `reviewed_at` order**.
- Consequence: a Memorised mark on the phone and a Missed it on the laptop both survive, and the later one decides current state. Nothing is silently lost.
- Known weakness: device clock skew can misorder events. Mitigation: record server `received_at` too and use it to detect and flag large skews.
- `settings` (shuffle, etc.) is a single row using last-write-wins with `updated_at`.

## 6. Non-functional requirements

### Performance
- NFR-1. Next card appears < 100 ms after rating (all local, no network wait).
- NFR-2. Cold load < 2 s on mid-range phone over 4G; deck is cached after first load.

### Reliability and availability
- NFR-3. App fully usable offline after first load. Review events queue locally (IndexedDB) and survive tab close or crash.
- NFR-4. Sync is idempotent and retried with backoff. A failed sync never blocks studying.
- NFR-5. No review event is ever lost: write to local store before attempting network.

### Security
- NFR-6. Row-level security: a user can read and write only rows where `user_id = auth.uid()`. This is enforced in the database, not in client code.
- NFR-7. Only the public anon key ships to the client. The service-role key never appears in the repo or bundle.
- NFR-8. Secrets in environment variables, `.env` git-ignored.
- NFR-9. Input validation on the import feature (schema-check and size-limit the JSON; never trust a file).
- [v2] NFR-10. Strict CSP, HTTPS only.

### Usability and compatibility
- NFR-11. Responsive: phone portrait, iPad, laptop. Touch targets >= 44 px.
- NFR-12. Installable as a PWA (home-screen icon, standalone mode) on iOS and Android.
- NFR-13. (Basics in v1; heavy polish is v2) Accessible: keyboard operable, sufficient contrast, respects reduced-motion.
- NFR-14. Safari/iOS storage can be evicted. Sync to server is the durable copy, so warn if unsynced events are pending.

### Observability
- NFR-15. Client logs sync failures with a visible "last synced at" indicator and pending-event count.
- [v2] NFR-16. Basic error reporting (console plus optional free-tier Sentry).

### Maintainability and testability
- NFR-17. Pure-function core: `computeWordState(events, settings)` and `buildSessionPile(day, states)` with no UI or network dependency, unit-tested.
- NFR-18. Required tests: status/pile edge cases, replay ordering, duplicate-event idempotency, offline-then-merge scenario.
- NFR-19. Deck parser has a validation script (counts, duplicates, empty fields).
- [v2] NFR-20. CI runs lint, tests and build on every push.

### Cost
- NFR-21. **Hard constraint: zero cost.** Only free tiers (static hosting, Supabase free plan, a free provider subdomain instead of a purchased domain, PWA install instead of the App Store). No paid service may be required. Note: free Supabase projects can pause after inactivity, so document how to resume it.

## 7. Suggested stack
- Frontend: React + TypeScript + Vite, PWA plugin, IndexedDB via `idb` or Dexie.
- Backend: Supabase (Postgres, Auth, RLS).
- Hosting: Vercel, Netlify or Cloudflare Pages.

## 8. Build order (each phase works on its own)
1. Parse PDF to `words.json` and validate.
2. Pure logic: state replay, card status, session pile, with tests.
3. Local-only UI: flip, rate, day pile, missing basket. No backend.
4. Local persistence (IndexedDB) and PWA/offline.
5. Supabase: schema, RLS policies, auth.
6. Sync engine: queue, push, pull, dedupe.
7. Progress views, search, export/import.
8. Hardening: security review, cross-device manual test, CI.

## 9. Open questions
- (Resolved) Q11: shuffled order is reproducible on every device via a random seed stored in the session record.
