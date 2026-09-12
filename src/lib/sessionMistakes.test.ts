import assert from 'node:assert/strict';
import { test } from 'node:test';

import { missedQuestionIdsFromAnswers } from '@/lib/sessionMistakes';

test('missedQuestionIdsFromAnswers returns unique incorrect answers from one session', () => {
  assert.deepEqual(
    missedQuestionIdsFromAnswers([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: false },
      { questionId: 'q3', isCorrect: null },
      { questionId: 'q2', isCorrect: false },
      { questionId: 'q4', isCorrect: false },
    ]),
    ['q2', 'q4'],
  );
});

test('missedQuestionIdsFromAnswers is empty when the session has no misses', () => {
  assert.deepEqual(
    missedQuestionIdsFromAnswers([
      { questionId: 'q1', isCorrect: true },
      { questionId: 'q2', isCorrect: null },
    ]),
    [],
  );
});
