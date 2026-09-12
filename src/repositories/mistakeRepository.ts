import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CERTIFICATION_ID } from '@/certifications';
import { mapMistake, type MistakeRow } from '@/db/mappers';
import { nowIso } from '@/lib/ids';
import type { MistakeRecord } from '@/types/session';

export function createMistakeRepository(db: SQLiteDatabase) {
  return {
    async record(certificationId: string, questionId: string, sessionId: string): Promise<void> {
      const now = nowIso();
      await db.runAsync(
        `
        INSERT INTO mistakes (question_id, certification_id, times_missed, last_missed_at, last_session_id)
        VALUES (?, ?, 1, ?, ?)
        ON CONFLICT(question_id) DO UPDATE SET
          certification_id = excluded.certification_id,
          times_missed = times_missed + 1,
          last_missed_at = excluded.last_missed_at,
          last_session_id = excluded.last_session_id
        `,
        questionId,
        certificationId,
        now,
        sessionId,
      );
    },

    async recordMany(certificationId: string, questionIds: string[], sessionId: string): Promise<void> {
      for (const questionId of questionIds) {
        await this.record(certificationId, questionId, sessionId);
      }
    },

    async list(certificationId: string = DEFAULT_CERTIFICATION_ID): Promise<MistakeRecord[]> {
      const rows = await db.getAllAsync<MistakeRow>(
        'SELECT * FROM mistakes WHERE certification_id = ? ORDER BY last_missed_at DESC',
        certificationId,
      );
      return rows.map(mapMistake);
    },

    async getQuestionIds(certificationId: string = DEFAULT_CERTIFICATION_ID): Promise<string[]> {
      const rows = await db.getAllAsync<{ question_id: string }>(
        'SELECT question_id FROM mistakes WHERE certification_id = ? ORDER BY last_missed_at DESC',
        certificationId,
      );
      return rows.map((row) => row.question_id);
    },

    async resolve(questionId: string): Promise<void> {
      await db.runAsync('DELETE FROM mistakes WHERE question_id = ?', questionId);
    },
  };
}
