import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_CERTIFICATION_ID, resolveCertificationId } from '@/certifications';
import { nowIso } from '@/lib/ids';

export const SELECTED_CERTIFICATION_KEY = 'selected_certification_id';

export function createSettingsRepository(db: SQLiteDatabase) {
  return {
    async get(key: string): Promise<string | null> {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?',
        key,
      );
      return row?.value ?? null;
    },

    async set(key: string, value: string): Promise<void> {
      await db.runAsync(
        `
        INSERT INTO app_settings (key, value, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = excluded.updated_at
        `,
        key,
        value,
        nowIso(),
      );
    },

    async getSelectedCertificationId(): Promise<string> {
      const stored = await this.get(SELECTED_CERTIFICATION_KEY);
      return resolveCertificationId(stored ?? DEFAULT_CERTIFICATION_ID) ?? DEFAULT_CERTIFICATION_ID;
    },

    async setSelectedCertificationId(certificationId: string): Promise<void> {
      const resolved = resolveCertificationId(certificationId) ?? DEFAULT_CERTIFICATION_ID;
      await this.set(SELECTED_CERTIFICATION_KEY, resolved);
    },
  };
}
