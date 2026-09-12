import assert from 'node:assert/strict';
import { test } from 'node:test';

import { loadBundledQuestionCatalog, mergeQuestionCatalog } from '@/content/catalog';
import { sampleQuestions } from '@/data/sampleQuestions';
import type { Question } from '@/types/question';

const production = (id: string): Question => ({
  id,
  certificationId: 'az900',
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
  sourceUrl: 'https://learn.microsoft.com/azure',
  sourceTitle: 'Learn',
  verifiedDate: '2026-09-12',
  questionVersion: 1,
  contentStatus: 'verified',
});

test('bundled catalog keeps the 12 development samples and no unverified production items', () => {
  const catalog = loadBundledQuestionCatalog();
  assert.equal(catalog.length, 12);
  assert.ok(catalog.every((question) => question.contentStatus === 'development'));
  assert.ok(catalog.every((question) => question.id.startsWith('az900-dev-')));
  assert.ok(catalog.every((question) => question.certificationId === 'az900'));
  assert.equal(catalog.filter((question) => question.contentStatus === 'verified').length, 0);
});

test('mergeQuestionCatalog rejects production IDs that collide with development samples', () => {
  assert.throws(
    () => mergeQuestionCatalog(sampleQuestions, [production(sampleQuestions[0]!.id)]),
    /duplicate ID/,
  );
});

test('mergeQuestionCatalog rejects reserved development prefixes in production content', () => {
  assert.throws(
    () => mergeQuestionCatalog(sampleQuestions, [production('az900-dev-extra')]),
    /reserved development prefix/,
  );
});
