import type { SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from '@/db/migrations';
import { ensureUserProgress, seedSampleQuestions } from '@/db/seed';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await runMigrations(db);
  await seedSampleQuestions(db);
  await ensureUserProgress(db);
}
