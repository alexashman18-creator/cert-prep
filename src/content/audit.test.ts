import assert from 'node:assert/strict';
import { test } from 'node:test';

import { auditQuestionBank } from '@/content/audit';
import type { Question } from '@/types/question';

const question = (overrides: Partial<Question>): Question => ({
  id: 'q1',
  examVersion: 'AZ-900-2024',
  domain: 'cloud_concepts',
  objective: 'Describe cloud concepts',
  subobjective: 'Describe cloud computing',
  difficulty: 'beginner',
  questionText: 'Example?',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
    { id: 'd', text: 'D' },
  ],
  correctAnswerId: 'b',
  explanation: 'Because B.',
  optionExplanations: { a: 'no', b: 'yes', c: 'no', d: 'no' },
  sourceUrl: 'https://learn.microsoft.com',
  sourceTitle: 'Learn',
  verifiedDate: '2026-01-01',
  questionVersion: 1,
  contentStatus: 'verified',
  ...overrides,
});

test('audit reports status, domain, objective, difficulty, missing source, and stale verified dates', () => {
  const now = Date.parse('2026-09-12T00:00:00.000Z');
  const audit = auditQuestionBank(
    [
      question({ id: 'verified-fresh', verifiedDate: '2026-09-01', contentStatus: 'verified' }),
      question({
        id: 'verified-stale',
        verifiedDate: '2025-01-01',
        contentStatus: 'verified',
        objective: 'Describe architecture',
        domain: 'architecture_services',
        difficulty: 'advanced',
      }),
      question({
        id: 'dev-1',
        contentStatus: 'development',
        sourceUrl: '',
        sourceTitle: '',
        verifiedDate: null,
      }),
      question({ id: 'draft-1', contentStatus: 'draft', domain: 'management_governance' }),
      question({ id: 'retired-1', contentStatus: 'retired' }),
    ],
    { staleDays: 90, nowMs: now },
  );

  assert.equal(audit.total, 5);
  assert.equal(audit.byStatus.verified, 2);
  assert.equal(audit.byStatus.draft, 1);
  assert.equal(audit.byStatus.development, 1);
  assert.equal(audit.byStatus.retired, 1);
  assert.equal(audit.byDomain.cloud_concepts, 3);
  assert.equal(audit.byDomain.architecture_services, 1);
  assert.equal(audit.byDomain.management_governance, 1);
  assert.equal(audit.byObjective['Describe cloud concepts'], 4);
  assert.equal(audit.byDifficulty.beginner, 4);
  assert.equal(audit.byDifficulty.advanced, 1);
  assert.deepEqual(audit.missingSource, ['dev-1']);
  assert.deepEqual(audit.staleVerifiedIds, ['verified-stale']);
});
