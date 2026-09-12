# AZ-900 Prep architecture

AZ-900 Prep is a local-first React Native app built with Expo, Expo Router, TypeScript, Zustand, and Expo SQLite.

The first version is designed so a learner can complete practice and mock exams with no network connection. Progress must survive navigation, backgrounding, process death, and device restart.

## App structure

```
src/
  app/                 Expo Router screens
  components/          Reusable UI, question, exam, and results components
  data/                Development sample question bank
  db/                  SQLite migrations, seeding, and row mappers
  hooks/               Screen data hooks over the repository layer
  lib/                 Pure domain helpers (scoring, blueprint, timer)
  repositories/        Data-access layer. Screens do not run raw SQL.
  stores/              Lightweight Zustand UI state
  theme/               Design tokens
  types/               Question and session contracts
```

Routing is file-based under `src/app`:

- `/` home dashboard
- `/practice/setup` domain and length selection
- `/practice/session` answered-then-revealed practice
- `/practice/results` practice score and domain breakdown
- `/exam/session` timed mock exam
- `/exam/results` practice-performance results
- `/exam/review` post-exam answer review
- `/review` persisted mistakes

## State management

SQLite is the source of truth for:

- questions
- practice and exam sessions
- answers
- flags
- mistakes
- aggregate progress

Zustand holds only ephemeral UI state:

- selected option before a practice submit
- whether the current practice item has been submitted
- exam navigator visibility

Home, results, and resume banners always read from repositories so killing the app cannot lose committed progress.

## SQLite architecture

The database file is `az900-prep.db`.

Web preview uses Expo’s alpha SQLite/wasm build. The app is configured with `web.output: "single"` and Metro `wasm` assets so the worker can bundle. Native iOS/Android remain the primary targets.

`SQLiteProvider` opens the database and runs `initializeDatabase`:

1. Apply versioned migrations via `PRAGMA user_version`.
2. Upsert the development sample questions.
3. Ensure a single `user_progress` row exists.

Schema version 1 creates:

- `questions`
- `practice_sessions` and `practice_answers`
- `exam_sessions` and `exam_answers`
- `flagged_questions`
- `mistakes`
- `user_progress`

Future schema changes must add a new numbered migration and bump `SCHEMA_VERSION`. Do not edit applied SQL in place.

Repositories receive a `SQLiteDatabase` and return typed domain objects. UI components import hooks, not SQL.

## Question model

The question contract is sized for a 500+ item bank without structural change:

- `id`
- `examVersion`
- `domain`
- `objective`
- `subobjective`
- `difficulty`
- `questionText`
- four `options`
- `correctAnswerId`
- overall `explanation`
- `optionExplanations` for every option
- `sourceUrl`, `sourceTitle`, `verifiedDate`
- `questionVersion`
- `contentStatus` (`development_sample` or `verified`)

Questions are stored as rows with JSON columns for options and option explanations. The current seed contains 12 original development samples only.

## Session persistence strategy

Practice:

- Question IDs are chosen when the session is created and then stored.
- A submitted answer is written immediately, mistakes and progress update in the same flow.
- `current_index` is written on Next.
- Leaving the app mid-session is safe; Home offers Resume.

Exam:

- The selected question set, answers, flags, and current index are persisted locally.
- Answers are saved on selection so Next/Previous never loses work.
- Remaining time is always derived from `started_at + duration_seconds - now` (`remainingFromDeadline`). The live interval recalculates from that deadline; it does not decrement an in-memory counter.
- `remaining_seconds` and `last_tick_at` are checkpoints only. Restore never trusts them as the source of remaining time.
- The exam clock continues while the app is backgrounded or closed, matching a real timed exam.
- If remaining time is already zero on restore, the exam is expired and scored. Extra time is not restored.
- Home copy advertises `min(bankSize, 40)` unique questions. The engine still targets 40 once the bank is large enough and never duplicates items to pad a smaller bank.
- Tapping Mock Exam while an unfinished exam exists offers Resume Exam, Start New Exam, or Cancel. Start New requires a second confirmation and abandons the previous in-progress exam.
- Practice Results → Review Mistakes reviews only that session’s incorrect `practice_answers`. Home → Review Mistakes still lists every outstanding saved mistake.

Unexpected termination can lose at most a few unsaved timer seconds, not answers or flags.

Starting a new practice session abandons any other in-progress practice session so Home never shows a stale resume card. The same applies to mock exams. Returning to Home also expires a timed-out in-progress exam and scores it instead of offering Resume.

Incorrect answers are stored once per question ID. A later correct answer removes that ID from Review Mistakes. Missing the same item again creates a single row, not a duplicate.

Scoring is percentage accuracy and is labeled as practice performance. The app does not treat 70% raw as a Microsoft 700/1000 scaled score.

## Future Supabase sync

Keep repositories as the only persistence boundary. A later sync layer can sit behind the same interfaces:

1. Continue writing locally first.
2. Add optional `remote_id`, `dirty`, and `updated_at` columns through a new migration.
3. Introduce a sync service that uploads sessions, answers, mistakes, and progress when the user is authenticated.
4. Resolve conflicts by `updated_at` and session status. In-progress local exams must never be overwritten by a stale remote copy.
5. The question bank can later be refreshed from Supabase, but seeded/local questions must remain usable offline.

Do not call Supabase from screens.

## Future RevenueCat integration

The product currently has no paywall. The natural insertion points are:

- a `entitlements` module read by Home before starting a mock exam or unlocking a larger question bank
- a later Settings or Paywall route
- repository-level feature flags, not scattered `if (premium)` checks in question components

Practice with the development sample bank should remain usable so the local-first loop still works before a purchase is configured.
