import type { SQLiteDatabase } from 'expo-sqlite';

import { loadBundledQuestionCatalog } from '@/content/catalog';
import { planQuestionImport } from '@/content/importPlan';
import { nowIso } from '@/lib/ids';
import { toJson } from '@/lib/json';
import type { Question } from '@/types/question';

async function listStoredVersions(db: SQLiteDatabase): Promise<{ id: string; questionVersion: number }[]> {
  const rows = await db.getAllAsync<{ id: string; question_version: number }>(
    'SELECT id, question_version FROM questions',
  );
  return rows.map((row) => ({ id: row.id, questionVersion: row.question_version }));
}

async function writeQuestion(db: SQLiteDatabase, question: Question, createdAt: string, updatedAt: string): Promise<void> {
  await db.runAsync(
    `
    INSERT INTO questions (
      id, exam_version, domain, objective, subobjective, difficulty,
      question_text, options_json, correct_answer_id, explanation,
      option_explanations_json, source_url, source_title, verified_date,
      question_version, content_status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      exam_version = excluded.exam_version,
      domain = excluded.domain,
      objective = excluded.objective,
      subobjective = excluded.subobjective,
      difficulty = excluded.difficulty,
      question_text = excluded.question_text,
      options_json = excluded.options_json,
      correct_answer_id = excluded.correct_answer_id,
      explanation = excluded.explanation,
      option_explanations_json = excluded.option_explanations_json,
      source_url = excluded.source_url,
      source_title = excluded.source_title,
      verified_date = excluded.verified_date,
      question_version = excluded.question_version,
      content_status = excluded.content_status,
      updated_at = excluded.updated_at
    WHERE excluded.question_version > questions.question_version
    `,
    question.id,
    question.examVersion,
    question.domain,
    question.objective,
    question.subobjective,
    question.difficulty,
    question.questionText,
    toJson(question.options),
    question.correctAnswerId,
    question.explanation,
    toJson(question.optionExplanations),
    question.sourceUrl,
    question.sourceTitle,
    question.verifiedDate,
    question.questionVersion,
    question.contentStatus,
    createdAt,
    updatedAt,
  );
}

export async function seedQuestionBank(db: SQLiteDatabase): Promise<void> {
  const catalog = loadBundledQuestionCatalog();
  const existing = await listStoredVersions(db);
  const plan = planQuestionImport(catalog, existing);
  const timestamp = nowIso();

  await db.withTransactionAsync(async () => {
    for (const question of plan.insert) {
      await writeQuestion(db, question, timestamp, timestamp);
    }
    for (const question of plan.update) {
      await writeQuestion(db, question, timestamp, timestamp);
    }
  });
}

export async function seedSampleQuestions(db: SQLiteDatabase): Promise<void> {
  await seedQuestionBank(db);
}

export async function ensureUserProgress(db: SQLiteDatabase): Promise<void> {
  await db.runAsync(
    `
    INSERT INTO user_progress (
      id, questions_answered, questions_correct, mock_exam_best_percent, updated_at
    ) VALUES ('default', 0, 0, NULL, ?)
    ON CONFLICT(id) DO NOTHING
    `,
    nowIso(),
  );
}
