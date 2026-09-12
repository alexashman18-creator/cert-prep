import assert from 'node:assert/strict';
import { test } from 'node:test';

import { classifyExamAnswers } from '@/lib/completeExam';
import type { Question } from '@/types/question';
import type { SessionAnswer } from '@/types/session';

const question = (id: string, correct = 'b'): Question => ({
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
  correctAnswerId: correct,
  explanation: 'Because B.',
  optionExplanations: { a: 'no', b: 'yes', c: 'no', d: 'no' },
  sourceUrl: 'https://learn.microsoft.com',
  sourceTitle: 'Learn',
  verifiedDate: null,
  questionVersion: 1,
  contentStatus: 'development_sample',
});

const answer = (questionId: string, selectedOptionId: string | null): SessionAnswer => ({
  id: `a-${questionId}`,
  sessionId: 'exam-1',
  questionId,
  selectedOptionId,
  isCorrect: null,
  answeredAt: selectedOptionId ? '2026-09-12T12:00:00.000Z' : null,
});

test('classifyExamAnswers records misses without duplicating unanswered items', () => {
  const classified = classifyExamAnswers(
    [question('q1'), question('q2'), question('q3')],
    [answer('q1', 'a'), answer('q2', 'b')],
  );
  assert.deepEqual(classified.missedIds, ['q1']);
  assert.deepEqual(classified.correctIds, ['q2']);
});
