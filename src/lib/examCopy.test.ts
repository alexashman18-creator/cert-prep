import assert from 'node:assert/strict';
import { test } from 'node:test';

import { availableExamQuestionCount, mockExamSubtitle } from '@/lib/examCopy';

test('availableExamQuestionCount never exceeds the unique bank or the 40-question target', () => {
  assert.equal(availableExamQuestionCount(12), 12);
  assert.equal(availableExamQuestionCount(40), 40);
  assert.equal(availableExamQuestionCount(500), 40);
  assert.equal(availableExamQuestionCount(0), 0);
});

test('mockExamSubtitle is truthful when the development bank is smaller than 40', () => {
  assert.equal(mockExamSubtitle(12), '12 available questions · 45-minute timer');
  assert.equal(mockExamSubtitle(40), '40 questions · 45-minute timer');
  assert.equal(mockExamSubtitle(0), 'No questions available yet');
});
