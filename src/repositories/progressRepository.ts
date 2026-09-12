import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CERTIFICATION_ID } from '@/certifications';
import { mapProgress, type ProgressRow } from '@/db/mappers';
import { ensureUserProgress } from '@/db/seed';
import { nowIso } from '@/lib/ids';
import type { UserProgress } from '@/types/session';

export function createProgressRepository(db: SQLiteDatabase) {
  return {
    async ensure(certificationId: string = DEFAULT_CERTIFICATION_ID): Promise<void> {
      await ensureUserProgress(db, certificationId);
    },

    async get(certificationId: string = DEFAULT_CERTIFICATION_ID): Promise<UserProgress> {
      await this.ensure(certificationId);
      const row = await db.getFirstAsync<ProgressRow>(
        'SELECT * FROM user_progress WHERE certification_id = ?',
        certificationId,
      );
      if (!row) {
        throw new Error(`User progress row is missing for ${certificationId}.`);
      }
      return mapProgress(row);
    },

    async recordPracticeAnswer(certificationId: string, isCorrect: boolean): Promise<void> {
      await this.ensure(certificationId);
      await db.runAsync(
        `
        UPDATE user_progress
        SET questions_answered = questions_answered + 1,
            questions_correct = questions_correct + ?,
            updated_at = ?
        WHERE certification_id = ?
        `,
        isCorrect ? 1 : 0,
        nowIso(),
        certificationId,
      );
    },

    async recordExamCompletion(
      certificationId: string,
      input: {
        questionsAnswered: number;
        questionsCorrect: number;
        percent: number;
      },
    ): Promise<void> {
      const current = await this.get(certificationId);
      const best =
        current.mockExamBestPercent === null
          ? input.percent
          : Math.max(current.mockExamBestPercent, input.percent);

      await db.runAsync(
        `
        UPDATE user_progress
        SET questions_answered = questions_answered + ?,
            questions_correct = questions_correct + ?,
            mock_exam_best_percent = ?,
            updated_at = ?
        WHERE certification_id = ?
        `,
        input.questionsAnswered,
        input.questionsCorrect,
        best,
        nowIso(),
        certificationId,
      );
    },
  };
}
