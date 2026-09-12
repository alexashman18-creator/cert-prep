import assert from 'node:assert/strict';
import { test } from 'node:test';

import { filterEligibleQuestions, isEligibleForSessions } from '@/content/eligibility';

test('only development and verified questions are eligible for normal sessions', () => {
  assert.equal(isEligibleForSessions('verified', true), true);
  assert.equal(isEligibleForSessions('development', true), true);
  assert.equal(isEligibleForSessions('draft', true), false);
  assert.equal(isEligibleForSessions('retired', true), false);
});

test('production sessions exclude development questions', () => {
  assert.equal(isEligibleForSessions('development', false), false);
  assert.equal(isEligibleForSessions('verified', false), true);
  assert.deepEqual(
    filterEligibleQuestions(
      [
        { contentStatus: 'development' },
        { contentStatus: 'draft' },
        { contentStatus: 'verified' },
        { contentStatus: 'retired' },
      ],
      false,
    ),
    [{ contentStatus: 'verified' }],
  );
});
