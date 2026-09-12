import type { SQLiteDatabase } from 'expo-sqlite';

import { mapMistake, type MistakeRow } from '@/db/mappers';
import { nowIso } from '@/lib/ids';
import type { MistakeRecord } from '@/types/session';

export function createMistakeRepository(db: SQLiteDatabase) {
  return {
    async record(questionId: string, sessionId: string): Promise<void> {
      const now = nowIso();
      await db.runAsync(
        `
        INSERT INTO mistakes (question_id, times_missed, last_missed_at, last_session_id)
        VALUES (?, 1, ?, ?)
        ON CONFLICT(question_id) DO UPDATE SET
          times_missed = times_missed + 1,
          last_missed_at = excluded.last_missed_at,
          last_session_id = excluded.last_session_id
        `,
        questionId,
        now,
        sessionId,
      );
    },

    async recordMany(questionIds: string[], sessionId: string): Promise<void> {
      for (const questionId of questionIds) {
        await this.record(questionId, sessionId);
      }
    },

    async list(): Promise<MistakeRecord[]> {
      const rows = await db.getAllAsync<MistakeRow>(
        'SELECT * FROM mistakes ORDER BY last_missed_at DESC',
      );
      return rows.map(mapMistake);
    },

    async getQuestionIds(): Promise<string[]> {
      const rows = await db.getAllAsync<{ question_id: string }>(
        'SELECT question_id FROM mistakes ORDER BY last_missed_at DESC',
      );
      return rows.map((row) => row.question_id);
    },

    async resolve(questionId: string): Promise<void> {
      await db.runAsync('DELETE FROM mistakes WHERE question_id = ?', questionId);
    },
  };
}
