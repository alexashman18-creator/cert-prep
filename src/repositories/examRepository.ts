import type { SQLiteDatabase } from 'expo-sqlite';

import { mapAnswer, mapExamSession, type AnswerRow, type ExamSessionRow } from '@/db/mappers';
import { createId, nowIso } from '@/lib/ids';
import { toJson } from '@/lib/json';
import type { ExamSession, SessionAnswer, SessionStatus } from '@/types/session';

export function createExamRepository(db: SQLiteDatabase) {
  return {
    async create(input: {
      questionIds: string[];
      durationSeconds: number;
    }): Promise<ExamSession> {
      const now = nowIso();
      const session: ExamSession = {
        id: createId('exam'),
        questionIds: input.questionIds,
        currentIndex: 0,
        durationSeconds: input.durationSeconds,
        remainingSeconds: input.durationSeconds,
        lastTickAt: now,
        status: 'in_progress',
        startedAt: now,
        completedAt: null,
        score: null,
        updatedAt: now,
      };

      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE exam_sessions
          SET status = 'abandoned', updated_at = ?
          WHERE status = 'in_progress'
          `,
          now,
        );
        await db.runAsync(
          `
          INSERT INTO exam_sessions (
            id, question_ids_json, current_index, duration_seconds, remaining_seconds,
            last_tick_at, status, started_at, completed_at, score, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          session.id,
          toJson(session.questionIds),
          session.currentIndex,
          session.durationSeconds,
          session.remainingSeconds,
          session.lastTickAt,
          session.status,
          session.startedAt,
          session.completedAt,
          session.score,
          session.updatedAt,
        );
      });

      return session;
    },

    async getById(id: string): Promise<ExamSession | null> {
      const row = await db.getFirstAsync<ExamSessionRow>(
        'SELECT * FROM exam_sessions WHERE id = ?',
        id,
      );
      return row ? mapExamSession(row) : null;
    },

    async getInProgress(): Promise<ExamSession | null> {
      const row = await db.getFirstAsync<ExamSessionRow>(
        `
        SELECT * FROM exam_sessions
        WHERE status = 'in_progress'
        ORDER BY updated_at DESC
        LIMIT 1
        `,
      );
      return row ? mapExamSession(row) : null;
    },

    async updatePosition(id: string, currentIndex: number): Promise<void> {
      await db.runAsync(
        'UPDATE exam_sessions SET current_index = ?, updated_at = ? WHERE id = ?',
        currentIndex,
        nowIso(),
        id,
      );
    },

    async persistTimer(id: string, remainingSeconds: number): Promise<void> {
      const now = nowIso();
      await db.runAsync(
        `
        UPDATE exam_sessions
        SET remaining_seconds = ?, last_tick_at = ?, updated_at = ?
        WHERE id = ? AND status = 'in_progress'
        `,
        remainingSeconds,
        now,
        now,
        id,
      );
    },

    async complete(id: string, score: number, status: Extract<SessionStatus, 'completed' | 'expired'>): Promise<void> {
      const now = nowIso();
      await db.runAsync(
        `
        UPDATE exam_sessions
        SET status = ?, score = ?, completed_at = ?, remaining_seconds = 0, updated_at = ?
        WHERE id = ?
        `,
        status,
        score,
        now,
        now,
        id,
      );
    },

    async saveAnswer(input: {
      sessionId: string;
      questionId: string;
      selectedOptionId: string;
    }): Promise<SessionAnswer> {
      const now = nowIso();
      const answer: SessionAnswer = {
        id: createId('eanswer'),
        sessionId: input.sessionId,
        questionId: input.questionId,
        selectedOptionId: input.selectedOptionId,
        isCorrect: null,
        answeredAt: now,
      };

      await db.runAsync(
        `
        INSERT INTO exam_answers (
          id, session_id, question_id, selected_option_id, is_correct, answered_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, question_id) DO UPDATE SET
          selected_option_id = excluded.selected_option_id,
          answered_at = excluded.answered_at
        `,
        answer.id,
        answer.sessionId,
        answer.questionId,
        answer.selectedOptionId,
        null,
        answer.answeredAt,
      );

      await db.runAsync(
        'UPDATE exam_sessions SET updated_at = ? WHERE id = ?',
        now,
        input.sessionId,
      );

      return answer;
    },

    async getAnswers(sessionId: string): Promise<SessionAnswer[]> {
      const rows = await db.getAllAsync<AnswerRow>(
        'SELECT * FROM exam_answers WHERE session_id = ?',
        sessionId,
      );
      return rows.map(mapAnswer);
    },
  };
}
