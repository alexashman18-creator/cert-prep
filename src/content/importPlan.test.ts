import assert from 'node:assert/strict';
import { test } from 'node:test';

import { planQuestionImport, summarizeImportPlan } from '@/content/importPlan';
import type { Question } from '@/types/question';

const question = (overrides: Partial<Question> = {}): Question => ({
  id: 'az900-2024-cc-001',
  certificationId: 'az900',
  examVersion: 'AZ-900-2024',
  domain: 'cloud_concepts',
  objective: 'Describe cloud concepts',
  subobjective: 'Describe cloud computing',
  difficulty: 'beginner',
  questionText: 'Which option is correct?',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' },
    { id: 'd', text: 'D' },
  ],
  correctAnswerId: 'b',
  explanation: 'B is correct.',
  optionExplanations: { a: 'no', b: 'yes', c: 'no', d: 'no' },
  sourceUrl: 'https://learn.microsoft.com/azure',
  sourceTitle: 'Microsoft Learn',
  verifiedDate: '2026-09-12',
  questionVersion: 1,
  contentStatus: 'verified',
  ...overrides,
});

test('plans inserts for new IDs and updates only when questionVersion is newer', () => {
  const incoming = [
    question({ id: 'new-1', questionVersion: 1 }),
    question({ id: 'existing-1', questionVersion: 3, contentStatus: 'retired' }),
    question({ id: 'existing-2', questionVersion: 1 }),
    question({ id: 'existing-3', questionVersion: 2 }),
  ];
  const plan = planQuestionImport(incoming, [
    { id: 'existing-1', questionVersion: 2 },
    { id: 'existing-2', questionVersion: 2 },
    { id: 'existing-3', questionVersion: 2 },
  ]);

  assert.deepEqual(
    plan.insert.map((item) => item.id),
    ['new-1'],
  );
  assert.deepEqual(
    plan.update.map((item) => [item.id, item.contentStatus, item.questionVersion]),
    [['existing-1', 'retired', 3]],
  );
  assert.deepEqual(
    plan.skip.map((item) => [item.question.id, item.reason]),
    [
      ['existing-2', 'older_version'],
      ['existing-3', 'same_version'],
    ],
  );
  assert.deepEqual(summarizeImportPlan(plan), { inserted: 1, updated: 1, skipped: 2 });
});

test('never plans a delete, so retired items keep their ID for historical results', () => {
  const plan = planQuestionImport(
    [question({ id: 'keep-me', contentStatus: 'retired', questionVersion: 2 })],
    [{ id: 'keep-me', questionVersion: 1 }],
  );
  assert.equal(plan.update[0]?.id, 'keep-me');
  assert.equal(plan.update[0]?.contentStatus, 'retired');
});
