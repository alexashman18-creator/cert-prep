import { sessionEligibleStatuses, shouldIncludeDevelopmentQuestions } from '@/content/eligibility';
import type { SQLiteDatabase } from 'expo-sqlite';

import { mapQuestion, type QuestionRow } from '@/db/mappers';
import type { DomainId } from '@/types/domain';
import type { Question } from '@/types/question';

function inList(values: string[]): string {
  return values.map(() => '?').join(', ');
}

export function createQuestionRepository(db: SQLiteDatabase) {
  return {
    async getAll(): Promise<Question[]> {
      const rows = await db.getAllAsync<QuestionRow>(
        'SELECT * FROM questions ORDER BY domain, id',
      );
      return rows.map(mapQuestion);
    },

    async getEligible(options?: {
      domain?: DomainId;
      includeDevelopment?: boolean;
    }): Promise<Question[]> {
      const includeDevelopment = options?.includeDevelopment ?? shouldIncludeDevelopmentQuestions();
      const statuses = sessionEligibleStatuses(includeDevelopment);
      const params: string[] = [...statuses];
      let sql = `SELECT * FROM questions WHERE content_status IN (${inList(statuses)})`;
      if (options?.domain) {
        sql += ' AND domain = ?';
        params.push(options.domain);
      }
      sql += ' ORDER BY domain, id';
      const rows = await db.getAllAsync<QuestionRow>(sql, ...params);
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

    async countEligible(options?: {
      domain?: DomainId;
      includeDevelopment?: boolean;
    }): Promise<number> {
      const includeDevelopment = options?.includeDevelopment ?? shouldIncludeDevelopmentQuestions();
      const statuses = sessionEligibleStatuses(includeDevelopment);
      const params: string[] = [...statuses];
      let sql = `SELECT COUNT(*) as count FROM questions WHERE content_status IN (${inList(statuses)})`;
      if (options?.domain) {
        sql += ' AND domain = ?';
        params.push(options.domain);
      }
      const row = await db.getFirstAsync<{ count: number }>(sql, ...params);
      return row?.count ?? 0;
    },

    async countByDomain(domain?: DomainId): Promise<number> {
      return this.countEligible({ domain });
    },

    async countByStatus(): Promise<Record<string, number>> {
      const rows = await db.getAllAsync<{ content_status: string; count: number }>(
        'SELECT content_status, COUNT(*) as count FROM questions GROUP BY content_status',
      );
      return Object.fromEntries(rows.map((row) => [row.content_status, row.count]));
    },
  };
}
