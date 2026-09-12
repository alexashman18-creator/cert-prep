import type { SQLiteDatabase } from 'expo-sqlite';

import { mapQuestion, type QuestionRow } from '@/db/mappers';
import type { DomainId } from '@/types/domain';
import type { Question } from '@/types/question';

export function createQuestionRepository(db: SQLiteDatabase) {
  return {
    async getAll(): Promise<Question[]> {
      const rows = await db.getAllAsync<QuestionRow>(
        'SELECT * FROM questions ORDER BY domain, id',
      );
      return rows.map(mapQuestion);
    },

    async getByIds(ids: string[]): Promise<Question[]> {
      if (ids.length === 0) {
        return [];
      }
      const placeholders = ids.map(() => '?').join(', ');
      const rows = await db.getAllAsync<QuestionRow>(
        `SELECT * FROM questions WHERE id IN (${placeholders})`,
        ...ids,
      );
      const byId = new Map(rows.map((row) => [row.id, mapQuestion(row)]));
      return ids
        .map((id) => byId.get(id))
        .filter((question): question is Question => question !== undefined);
    },

    async countByDomain(domain?: DomainId): Promise<number> {
      if (!domain) {
        const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM questions');
        return row?.count ?? 0;
      }
      const row = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM questions WHERE domain = ?',
        domain,
      );
      return row?.count ?? 0;
    },
  };
}
