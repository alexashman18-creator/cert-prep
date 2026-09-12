import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CERTIFICATION_ID, requireMockExamConfig } from '@/certifications';
import { SCHEMA_V1_SQL, SCHEMA_VERSION, runMigrations } from '@/db/migrations';
import { initializeDatabase } from '@/db/initialize';
import { selectExamQuestions } from '@/lib/examBlueprint';
import { createRepositories } from '@/repositories/createRepositories';

function createMemorySqlite(): { db: SQLiteDatabase; close: () => void } {
  const raw = new DatabaseSync(':memory:');
  const db = {
    execAsync: async (sql: string) => {
      raw.exec(sql);
    },
    runAsync: async (sql: string, ...params: unknown[]) => {
      raw.prepare(sql).run(...(params as never[]));
    },
    getFirstAsync: async <T>(sql: string, ...params: unknown[]) => {
      const row = raw.prepare(sql).get(...(params as never[]));
      return (row as T | undefined) ?? null;
    },
    getAllAsync: async <T>(sql: string, ...params: unknown[]) => {
      return raw.prepare(sql).all(...(params as never[])) as T[];
    },
    withTransactionAsync: async (work: () => Promise<void>) => {
      raw.exec('BEGIN');
      try {
        await work();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
  } as unknown as SQLiteDatabase;

  return {
    db,
    close: () => raw.close(),
  };
}

const NOW = '2026-09-01T12:00:00.000Z';

test('schema version is 3 after certification scoping', () => {
  assert.equal(SCHEMA_VERSION, 3);
});

test('existing AZ-900 rows migrate to az900 without resetting progress', async () => {
  const { db, close } = createMemorySqlite();
  try {
    await db.execAsync(SCHEMA_V1_SQL);
    await db.execAsync('PRAGMA user_version = 1');

    await db.runAsync(
      `
      INSERT INTO questions (
        id, exam_version, domain, objective, subobjective, difficulty,
        question_text, options_json, correct_answer_id, explanation,
        option_explanations_json, source_url, source_title, verified_date,
        question_version, content_status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      'az900-dev-cc-001',
      'AZ-900-2024',
      'cloud_concepts',
      'Describe cloud computing',
      'OpEx',
      'beginner',
      'Sample?',
      '[]',
      'b',
      'Because B.',
      '{}',
      'https://learn.microsoft.com',
      'Learn',
      null,
      1,
      'development',
      NOW,
    );
    await db.runAsync(
      `
      INSERT INTO user_progress (id, questions_answered, questions_correct, mock_exam_best_percent, updated_at)
      VALUES ('default', 42, 31, 77.5, ?)
      `,
      NOW,
    );
    await db.runAsync(
      `INSERT INTO mistakes (question_id, times_missed, last_missed_at, last_session_id) VALUES (?, 3, ?, ?)`,
      'az900-dev-cc-001',
      NOW,
      'practice-1',
    );
    await db.runAsync(
      `
      INSERT INTO practice_sessions (
        id, domain_filter, question_count, question_ids_json, current_index,
        status, started_at, completed_at, score, updated_at
      ) VALUES (?, 'all', 1, ?, 0, 'completed', ?, ?, 1, ?)
      `,
      'practice-1',
      '["az900-dev-cc-001"]',
      NOW,
      NOW,
      NOW,
    );
    await db.runAsync(
      `
      INSERT INTO exam_sessions (
        id, question_ids_json, current_index, duration_seconds, remaining_seconds,
        last_tick_at, status, started_at, completed_at, score, updated_at
      ) VALUES (?, ?, 0, 2700, 0, ?, 'completed', ?, ?, 8, ?)
      `,
      'exam-1',
      '["az900-dev-cc-001"]',
      NOW,
      NOW,
      NOW,
      NOW,
    );

    await runMigrations(db);

    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    assert.equal(version?.user_version, 3);

    const progress = await db.getFirstAsync<{
      questions_answered: number;
      questions_correct: number;
      mock_exam_best_percent: number | null;
      certification_id: string;
    }>('SELECT * FROM user_progress WHERE id = ?', 'default');
    assert.ok(progress);
    assert.equal(progress.certification_id, DEFAULT_CERTIFICATION_ID);
    assert.equal(progress.questions_answered, 42);
    assert.equal(progress.questions_correct, 31);
    assert.equal(progress.mock_exam_best_percent, 77.5);

    const question = await db.getFirstAsync<{ certification_id: string }>(
      'SELECT certification_id FROM questions WHERE id = ?',
      'az900-dev-cc-001',
    );
    const mistake = await db.getFirstAsync<{ certification_id: string; times_missed: number }>(
      'SELECT certification_id, times_missed FROM mistakes WHERE question_id = ?',
      'az900-dev-cc-001',
    );
    const practice = await db.getFirstAsync<{ certification_id: string }>(
      'SELECT certification_id FROM practice_sessions WHERE id = ?',
      'practice-1',
    );
    const exam = await db.getFirstAsync<{ certification_id: string }>(
      'SELECT certification_id FROM exam_sessions WHERE id = ?',
      'exam-1',
    );
    const selected = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'selected_certification_id'",
    );

    assert.equal(question?.certification_id, 'az900');
    assert.equal(mistake?.certification_id, 'az900');
    assert.equal(mistake?.times_missed, 3);
    assert.equal(practice?.certification_id, 'az900');
    assert.equal(exam?.certification_id, 'az900');
    assert.equal(selected?.value, 'az900');
  } finally {
    close();
  }
});

test('repairs a v3 database that never created app_settings', async () => {
  const { db, close } = createMemorySqlite();
  try {
    await db.execAsync(SCHEMA_V1_SQL);
    await db.execAsync('PRAGMA user_version = 3');
    await db.runAsync(
      `
      INSERT INTO user_progress (id, questions_answered, questions_correct, mock_exam_best_percent, updated_at)
      VALUES ('default', 18, 12, 70, ?)
      `,
      NOW,
    );

    await runMigrations(db);

    const progress = await db.getFirstAsync<{
      questions_answered: number;
      certification_id: string;
    }>('SELECT * FROM user_progress WHERE id = ?', 'default');
    const settings = await db.getFirstAsync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = 'selected_certification_id'",
    );
    assert.equal(progress?.questions_answered, 18);
    assert.equal(progress?.certification_id, 'az900');
    assert.equal(settings?.value, 'az900');
  } finally {
    close();
  }
});

test('progress, mistakes, sessions, and questions are isolated by certification', async () => {
  const { db, close } = createMemorySqlite();
  try {
    await initializeDatabase(db);
    const repos = createRepositories(db);

    await repos.progress.ensure('dp900');
    await db.runAsync(
      `
      INSERT INTO questions (
        id, certification_id, exam_version, domain, objective, subobjective, difficulty,
        question_text, options_json, correct_answer_id, explanation,
        option_explanations_json, source_url, source_title, verified_date,
        question_version, content_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      'dp900-dev-001',
      'dp900',
      'DP-900-pending',
      'core_data',
      'Data concepts',
      'Placeholder',
      'beginner',
      'Placeholder DP-900 item?',
      '[{"id":"a","text":"A"},{"id":"b","text":"B"},{"id":"c","text":"C"},{"id":"d","text":"D"}]',
      'b',
      'Placeholder.',
      '{"a":"no","b":"yes","c":"no","d":"no"}',
      '',
      '',
      null,
      1,
      'development',
      NOW,
      NOW,
    );

    const az900Questions = await repos.questions.getEligible({ certificationId: 'az900' });
    const dp900Questions = await repos.questions.getEligible({ certificationId: 'dp900' });
    assert.equal(az900Questions.length, 62);
    assert.ok(az900Questions.every((question) => question.certificationId === 'az900'));
    assert.equal(dp900Questions.length, 1);
    assert.equal(dp900Questions[0]?.id, 'dp900-dev-001');

    await repos.progress.recordPracticeAnswer('az900', true);
    await repos.progress.recordPracticeAnswer('az900', false);
    await repos.progress.recordPracticeAnswer('dp900', true);
    const az900Progress = await repos.progress.get('az900');
    const dp900Progress = await repos.progress.get('dp900');
    assert.equal(az900Progress.questionsAnswered, 2);
    assert.equal(az900Progress.questionsCorrect, 1);
    assert.equal(dp900Progress.questionsAnswered, 1);
    assert.equal(dp900Progress.questionsCorrect, 1);

    await repos.mistakes.record('az900', 'az900-dev-cc-001', 'practice-az');
    await repos.mistakes.record('dp900', 'dp900-dev-001', 'practice-dp');
    assert.deepEqual(await repos.mistakes.getQuestionIds('az900'), ['az900-dev-cc-001']);
    assert.deepEqual(await repos.mistakes.getQuestionIds('dp900'), ['dp900-dev-001']);

    const az900Practice = await repos.practice.create({
      certificationId: 'az900',
      domainFilter: 'all',
      questionIds: ['az900-dev-cc-001'],
    });
    const dp900Practice = await repos.practice.create({
      certificationId: 'dp900',
      domainFilter: 'all',
      questionIds: ['dp900-dev-001'],
    });
    const az900Exam = await repos.exams.create({
      certificationId: 'az900',
      questionIds: ['az900-dev-cc-001'],
      durationSeconds: 2700,
    });
    const dp900Exam = await repos.exams.create({
      certificationId: 'dp900',
      questionIds: ['dp900-dev-001'],
      durationSeconds: 1800,
    });

    await repos.practice.create({
      certificationId: 'az900',
      domainFilter: 'all',
      questionIds: ['az900-dev-cc-002'],
    });
    await repos.exams.create({
      certificationId: 'az900',
      questionIds: ['az900-dev-cc-002'],
      durationSeconds: 2700,
    });

    const abandonedAzPractice = await repos.practice.getById(az900Practice.id);
    const liveDpPractice = await repos.practice.getById(dp900Practice.id);
    const abandonedAzExam = await repos.exams.getById(az900Exam.id);
    const liveDpExam = await repos.exams.getById(dp900Exam.id);
    assert.equal(abandonedAzPractice?.status, 'abandoned');
    assert.equal(liveDpPractice?.status, 'in_progress');
    assert.equal(abandonedAzExam?.status, 'abandoned');
    assert.equal(liveDpExam?.status, 'in_progress');
    assert.equal((await repos.practice.getInProgress('dp900'))?.id, dp900Practice.id);
    assert.equal((await repos.exams.getInProgress('dp900'))?.id, dp900Exam.id);
    assert.ok((await repos.practice.getInProgress('az900'))?.id !== az900Practice.id);
  } finally {
    close();
  }
});

test('mock exam config is loaded from the selected certification', async () => {
  const { db, close } = createMemorySqlite();
  try {
    await initializeDatabase(db);
    const repos = createRepositories(db);
    const config = requireMockExamConfig('az900');
    const questions = selectExamQuestions(await repos.questions.getEligible({ certificationId: 'az900' }), config);
    assert.equal(config.targetQuestionCount, 40);
    assert.equal(config.examDurationMinutes, 45);
    assert.equal(questions.length, 40);
    assert.equal(new Set(questions.map((question) => question.id)).size, 40);
  } finally {
    close();
  }
});
