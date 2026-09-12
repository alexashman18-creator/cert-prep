import assert from 'node:assert/strict';
import { test } from 'node:test';

import { sampleQuestions } from '@/data/sampleQuestions';
import { assertQuestionShape } from '@/types/question';

test('development bank has four original items per domain', () => {
  const byDomain = {
    cloud_concepts: sampleQuestions.filter((question) => question.domain === 'cloud_concepts'),
    architecture_services: sampleQuestions.filter(
      (question) => question.domain === 'architecture_services',
    ),
    management_governance: sampleQuestions.filter(
      (question) => question.domain === 'management_governance',
    ),
  };

  assert.equal(sampleQuestions.length, 12);
  assert.equal(byDomain.cloud_concepts.length, 4);
  assert.equal(byDomain.architecture_services.length, 4);
  assert.equal(byDomain.management_governance.length, 4);
});

test('every sample question is marked as development content and has four explained options', () => {
  for (const question of sampleQuestions) {
    assertQuestionShape(question);
    assert.equal(question.contentStatus, 'development');
    assert.equal(question.verifiedDate, null);
    assert.match(question.id, /^az900-dev-/);
  }
});
