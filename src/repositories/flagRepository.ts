import type { SQLiteDatabase } from 'expo-sqlite';

import { mapFlag, type FlagRow } from '@/db/mappers';
import { createId, nowIso } from '@/lib/ids';
import type { FlaggedQuestion, SessionType } from '@/types/session';

export function createFlagRepository(db: SQLiteDatabase) {
  return {
    async list(sessionId: string, sessionType: SessionType): Promise<FlaggedQuestion[]> {
      const rows = await db.getAllAsync<FlagRow>(
        'SELECT * FROM flagged_questions WHERE session_id = ? AND session_type = ?',
        sessionId,
        sessionType,
      );
      return rows.map(mapFlag);
    },

    async set(input: {
      sessionId: string;
      sessionType: SessionType;
      questionId: string;
      flagged: boolean;
    }): Promise<void> {
      if (!input.flagged) {
        await db.runAsync(
          `
          DELETE FROM flagged_questions
          WHERE session_id = ? AND session_type = ? AND question_id = ?
          `,
          input.sessionId,
          input.sessionType,
          input.questionId,
        );
        return;
      }

      await db.runAsync(
        `
        INSERT INTO flagged_questions (id, session_id, session_type, question_id, flagged_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(session_id, session_type, question_id) DO NOTHING
        `,
        createId('flag'),
        input.sessionId,
        input.sessionType,
        input.questionId,
        nowIso(),
      );
    },
  };
}
