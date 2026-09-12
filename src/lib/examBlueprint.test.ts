import assert from 'node:assert/strict';
import { test } from 'node:test';

import { AZ900_MOCK_EXAM, requireMockExamConfig } from '@/certifications';
import { allocateDomainCounts, selectExamQuestions } from '@/lib/examBlueprint';
import { sampleQuestions } from '@/data/sampleQuestions';

test('allocateDomainCounts follows the AZ-900-style 27/38/35 split for 40 items', () => {
  const counts = allocateDomainCounts(40);
  assert.equal(counts.cloud_concepts, 11);
  assert.equal(counts.architecture_services, 15);
  assert.equal(counts.management_governance, 14);
  assert.equal(
    counts.cloud_concepts + counts.architecture_services + counts.management_governance,
    40,
  );
});

test('selectExamQuestions never duplicates items when the bank is smaller than 40', () => {
  const selected = selectExamQuestions(sampleQuestions, 40);
  const ids = selected.map((question) => question.id);
  assert.equal(selected.length, sampleQuestions.length);
  assert.equal(new Set(ids).size, ids.length);
});

test('selectExamQuestions uses certification mock-exam configuration', () => {
  const config = requireMockExamConfig('az900');
  assert.deepEqual(config, AZ900_MOCK_EXAM);
  const fromConfig = allocateDomainCounts(config.targetQuestionCount, config.domainWeights);
  assert.equal(fromConfig.cloud_concepts, 11);
  assert.equal(fromConfig.architecture_services, 15);
  assert.equal(fromConfig.management_governance, 14);
  const selected = selectExamQuestions(sampleQuestions, config);
  assert.equal(selected.length, 12);
  assert.equal(new Set(selected.map((question) => question.id)).size, 12);
});
