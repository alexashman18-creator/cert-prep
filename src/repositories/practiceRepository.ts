import type { SQLiteDatabase } from 'expo-sqlite';

import { mapAnswer, mapPracticeSession, type AnswerRow, type PracticeSessionRow } from '@/db/mappers';
import { createId, nowIso } from '@/lib/ids';
import { toJson } from '@/lib/json';
import type { PracticeDomainFilter, PracticeSession, SessionAnswer } from '@/types/session';

export function createPracticeRepository(db: SQLiteDatabase) {
  return {
    async create(input: {
      domainFilter: PracticeDomainFilter;
      questionIds: string[];
    }): Promise<PracticeSession> {
      const now = nowIso();
      const session: PracticeSession = {
        id: createId('practice'),
        domainFilter: input.domainFilter,
        questionCount: input.questionIds.length,
        questionIds: input.questionIds,
        currentIndex: 0,
        status: 'in_progress',
        startedAt: now,
        completedAt: null,
        score: null,
        updatedAt: now,
      };

      await db.runAsync(
        `
        INSERT INTO practice_sessions (
          id, domain_filter, question_count, question_ids_json, current_index,
          status, started_at, completed_at, score, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        session.id,
        session.domainFilter,
        session.questionCount,
        toJson(session.questionIds),
        session.currentIndex,
        session.status,
        session.startedAt,
        session.completedAt,
        session.score,
        session.updatedAt,
      );

      return session;
    },

    async getById(id: string): Promise<PracticeSession | null> {
      const row = await db.getFirstAsync<PracticeSessionRow>(
        'SELECT * FROM practice_sessions WHERE id = ?',
        id,
      );
      return row ? mapPracticeSession(row) : null;
    },

    async getInProgress(): Promise<PracticeSession | null> {
      const row = await db.getFirstAsync<PracticeSessionRow>(
        `
        SELECT * FROM practice_sessions
        WHERE status = 'in_progress'
        ORDER BY updated_at DESC
        LIMIT 1
        `,
      );
      return row ? mapPracticeSession(row) : null;
    },

    async updatePosition(id: string, currentIndex: number): Promise<void> {
      await db.runAsync(
        'UPDATE practice_sessions SET current_index = ?, updated_at = ? WHERE id = ?',
        currentIndex,
        nowIso(),
        id,
      );
    },

    async complete(id: string, score: number): Promise<void> {
      const now = nowIso();
      await db.runAsync(
        `
        UPDATE practice_sessions
        SET status = 'completed', score = ?, completed_at = ?, updated_at = ?
        WHERE id = ?
        `,
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
      isCorrect: boolean;
    }): Promise<SessionAnswer> {
      const answer: SessionAnswer = {
        id: createId('panswer'),
        sessionId: input.sessionId,
        questionId: input.questionId,
        selectedOptionId: input.selectedOptionId,
        isCorrect: input.isCorrect,
        answeredAt: nowIso(),
      };

      await db.runAsync(
        `
        INSERT INTO practice_answers (
          id, session_id, question_id, selected_option_id, is_correct, answered_at
        ) VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(session_id, question_id) DO UPDATE SET
          selected_option_id = excluded.selected_option_id,
          is_correct = excluded.is_correct,
          answered_at = excluded.answered_at
        `,
        answer.id,
        answer.sessionId,
        answer.questionId,
        answer.selectedOptionId,
        answer.isCorrect ? 1 : 0,
        answer.answeredAt,
      );

      await db.runAsync(
        'UPDATE practice_sessions SET updated_at = ? WHERE id = ?',
        answer.answeredAt,
        input.sessionId,
      );

      return answer;
    },

    async getAnswers(sessionId: string): Promise<SessionAnswer[]> {
      const rows = await db.getAllAsync<AnswerRow>(
        'SELECT * FROM practice_answers WHERE session_id = ?',
        sessionId,
      );
      return rows.map(mapAnswer);
    },
  };
}
