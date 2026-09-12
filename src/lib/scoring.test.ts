import assert from 'node:assert/strict';
import { test } from 'node:test';

import { accuracyPercent, buildSessionResults } from '@/lib/scoring';
import type { Question } from '@/types/question';

const question = (id: string, domain: Question['domain'], correct = 'b'): Question => ({
  id,
  examVersion: 'AZ-900-2024',
  domain,
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
  contentStatus: 'development',
});

test('accuracyPercent returns one-decimal percentages', () => {
  assert.equal(accuracyPercent(1, 3), 33.3);
  assert.equal(accuracyPercent(0, 0), 0);
  assert.equal(accuracyPercent(2, 4), 50);
});

test('buildSessionResults scores domains without treating unanswered as incorrect', () => {
  const results = buildSessionResults({
    sessionId: 'session-1',
    questions: [
      question('q1', 'cloud_concepts'),
      question('q2', 'cloud_concepts'),
      question('q3', 'architecture_services'),
    ],
    answersByQuestionId: {
      q1: 'b',
      q2: 'a',
    },
  });

  assert.equal(results.correct, 1);
  assert.equal(results.incorrect, 1);
  assert.equal(results.unanswered, 1);
  assert.equal(results.percent, 33.3);

  const cloud = results.domainPerformance.find((item) => item.domain === 'cloud_concepts');
  const architecture = results.domainPerformance.find(
    (item) => item.domain === 'architecture_services',
  );
  assert.equal(cloud?.answered, 2);
  assert.equal(cloud?.correct, 1);
  assert.equal(architecture?.answered, 0);
  assert.equal(architecture?.correct, 0);
});
