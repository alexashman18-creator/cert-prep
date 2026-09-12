import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  alignSessionQuestions,
  clampIndex,
  isResumableStatus,
  selectPracticeQuestionIds,
} from '@/lib/sessionIntegrity';
import type { Question } from '@/types/question';

const question = (id: string): Question => ({
  id,
  examVersion: 'AZ-900-2024',
  domain: 'cloud_concepts',
  objective: 'test',
  subobjective: 'test',
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
  verifiedDate: null,
  questionVersion: 1,
  contentStatus: 'development',
});

test('isResumableStatus only allows in-progress sessions', () => {
  assert.equal(isResumableStatus('in_progress'), true);
  assert.equal(isResumableStatus('completed'), false);
  assert.equal(isResumableStatus('expired'), false);
  assert.equal(isResumableStatus('abandoned'), false);
});

test('selectPracticeQuestionIds never exceeds the available bank', () => {
  const selected = selectPracticeQuestionIds(['a', 'b', 'c', 'd'], 30);
  assert.equal(selected.length, 4);
  assert.equal(new Set(selected).size, 4);
});

test('selectPracticeQuestionIds returns an empty list when nothing is available', () => {
  assert.deepEqual(selectPracticeQuestionIds([], 10), []);
});

test('alignSessionQuestions drops missing items and keeps the current question when possible', () => {
  const aligned = alignSessionQuestions(
    ['q1', 'missing', 'q3'],
    [question('q1'), question('q3')],
    2,
  );
  assert.deepEqual(
    aligned.questions.map((item) => item.id),
    ['q1', 'q3'],
  );
  assert.equal(aligned.currentIndex, 1);
  assert.equal(aligned.missingCount, 1);
});

test('alignSessionQuestions handles a fully unavailable bank', () => {
  const aligned = alignSessionQuestions(['gone'], [], 0);
  assert.equal(aligned.questions.length, 0);
  assert.equal(aligned.currentIndex, 0);
  assert.equal(aligned.missingCount, 1);
});

test('clampIndex stays inside bounds', () => {
  assert.equal(clampIndex(-2, 4), 0);
  assert.equal(clampIndex(9, 4), 3);
  assert.equal(clampIndex(1, 0), 0);
});
