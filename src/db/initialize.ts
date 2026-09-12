import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CERTIFICATION_ID } from '@/certifications';
import { runMigrations } from '@/db/migrations';
import { ensureAppSettings, ensureUserProgress, seedSampleQuestions } from '@/db/seed';

export async function initializeDatabase(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  await seedSampleQuestions(db);
  await ensureAppSettings(db);
  await ensureUserProgress(db, DEFAULT_CERTIFICATION_ID);
}
