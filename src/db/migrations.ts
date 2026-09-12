import type { SQLiteDatabase } from 'expo-sqlite';

export const SCHEMA_VERSION = 1;

const MIGRATION_V1 = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY NOT NULL,
  exam_version TEXT NOT NULL,
  domain TEXT NOT NULL,
  objective TEXT NOT NULL,
  subobjective TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options_json TEXT NOT NULL,
  correct_answer_id TEXT NOT NULL,
  explanation TEXT NOT NULL,
  option_explanations_json TEXT NOT NULL,
  source_url TEXT,
  source_title TEXT,
  verified_date TEXT,
  question_version INTEGER NOT NULL,
  content_status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_domain ON questions(domain);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(content_status);

CREATE TABLE IF NOT EXISTS practice_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  domain_filter TEXT NOT NULL,
  question_count INTEGER NOT NULL,
  question_ids_json TEXT NOT NULL,
  current_index INTEGER NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  score INTEGER,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_practice_sessions_status ON practice_sessions(status);

CREATE TABLE IF NOT EXISTS practice_answers (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT NOT NULL,
  is_correct INTEGER NOT NULL,
  answered_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES practice_sessions(id) ON DELETE CASCADE,
  UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_practice_answers_session ON practice_answers(session_id);

CREATE TABLE IF NOT EXISTS exam_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  question_ids_json TEXT NOT NULL,
  current_index INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  remaining_seconds INTEGER NOT NULL,
  last_tick_at TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  score INTEGER,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);

CREATE TABLE IF NOT EXISTS exam_answers (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  selected_option_id TEXT,
  is_correct INTEGER,
  answered_at TEXT,
  FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
  UNIQUE (session_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_session ON exam_answers(session_id);

CREATE TABLE IF NOT EXISTS flagged_questions (
  id TEXT PRIMARY KEY NOT NULL,
  session_id TEXT NOT NULL,
  session_type TEXT NOT NULL,
  question_id TEXT NOT NULL,
  flagged_at TEXT NOT NULL,
  UNIQUE (session_id, session_type, question_id)
);

CREATE INDEX IF NOT EXISTS idx_flagged_session ON flagged_questions(session_id, session_type);

CREATE TABLE IF NOT EXISTS mistakes (
  question_id TEXT PRIMARY KEY NOT NULL,
  times_missed INTEGER NOT NULL,
  last_missed_at TEXT NOT NULL,
  last_session_id TEXT
);

CREATE TABLE IF NOT EXISTS user_progress (
  id TEXT PRIMARY KEY NOT NULL,
  questions_answered INTEGER NOT NULL,
  questions_correct INTEGER NOT NULL,
  mock_exam_best_percent REAL,
  updated_at TEXT NOT NULL
);
`;

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let current = row?.user_version ?? 0;

  if (current > SCHEMA_VERSION) {
    throw new Error(`Database version ${current} is newer than app schema ${SCHEMA_VERSION}.`);
  }

  if (current === 0) {
    await db.execAsync(MIGRATION_V1);
    current = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}
