import type { SQLiteDatabase } from 'expo-sqlite';

import { createExamRepository } from '@/repositories/examRepository';
import { createFlagRepository } from '@/repositories/flagRepository';
import { createMistakeRepository } from '@/repositories/mistakeRepository';
import { createPracticeRepository } from '@/repositories/practiceRepository';
import { createProgressRepository } from '@/repositories/progressRepository';
import { createQuestionRepository } from '@/repositories/questionRepository';
import { createSettingsRepository } from '@/repositories/settingsRepository';

export function createRepositories(db: SQLiteDatabase) {
  return {
    questions: createQuestionRepository(db),
    practice: createPracticeRepository(db),
    exams: createExamRepository(db),
    progress: createProgressRepository(db),
    mistakes: createMistakeRepository(db),
    flags: createFlagRepository(db),
    settings: createSettingsRepository(db),
    async transaction<T>(work: () => Promise<T>): Promise<T> {
      let result: T | undefined;
      await db.withTransactionAsync(async () => {
        result = await work();
      });
      return result as T;
    },
  };
}

export type Repositories = ReturnType<typeof createRepositories>;
