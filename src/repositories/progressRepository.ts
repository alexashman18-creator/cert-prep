import type { SQLiteDatabase } from 'expo-sqlite';

import { mapProgress, type ProgressRow } from '@/db/mappers';
import { nowIso } from '@/lib/ids';
import type { UserProgress } from '@/types/session';

export function createProgressRepository(db: SQLiteDatabase) {
  return {
    async get(): Promise<UserProgress> {
      const row = await db.getFirstAsync<ProgressRow>(
        "SELECT * FROM user_progress WHERE id = 'default'",
      );
      if (!row) {
        throw new Error('User progress row is missing.');
      }
      return mapProgress(row);
    },

    async recordPracticeAnswer(isCorrect: boolean): Promise<void> {
      await db.runAsync(
        `
        UPDATE user_progress
        SET questions_answered = questions_answered + 1,
            questions_correct = questions_correct + ?,
            updated_at = ?
        WHERE id = 'default'
        `,
        isCorrect ? 1 : 0,
        nowIso(),
      );
    },

    async recordExamCompletion(input: {
      questionsAnswered: number;
      questionsCorrect: number;
      percent: number;
    }): Promise<void> {
      const current = await this.get();
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
        WHERE id = 'default'
        `,
        input.questionsAnswered,
        input.questionsCorrect,
        best,
        nowIso(),
      );
    },
  };
}
