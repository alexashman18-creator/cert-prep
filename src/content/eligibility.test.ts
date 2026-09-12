import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  INCLUDE_DEVELOPMENT_QUESTIONS,
  filterEligibleQuestions,
  filterQuestionsByCertification,
  isEligibleForSessions,
  resolveIncludeDevelopmentQuestions,
  sessionEligibleStatuses,
  shouldIncludeDevelopmentQuestions,
} from '@/content/eligibility';

test('verified-only is the default for normal sessions', () => {
  assert.equal(INCLUDE_DEVELOPMENT_QUESTIONS, false);
  assert.equal(shouldIncludeDevelopmentQuestions(), false);
  assert.deepEqual(sessionEligibleStatuses(), ['verified']);
  assert.equal(isEligibleForSessions('verified'), true);
  assert.equal(isEligibleForSessions('development'), false);
  assert.equal(isEligibleForSessions('draft'), false);
  assert.equal(isEligibleForSessions('retired'), false);
  assert.deepEqual(
    filterEligibleQuestions([
      { contentStatus: 'development' },
      { contentStatus: 'draft' },
      { contentStatus: 'verified' },
      { contentStatus: 'retired' },
    ]),
    [{ contentStatus: 'verified' }],
  );
});

test('production-style selection stays verified only', () => {
  assert.equal(isEligibleForSessions('development', false), false);
  assert.equal(isEligibleForSessions('verified', false), true);
  assert.deepEqual(sessionEligibleStatuses(false), ['verified']);
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

test('optional developer mode can include development questions', () => {
  assert.equal(resolveIncludeDevelopmentQuestions(true, true), true);
  assert.deepEqual(sessionEligibleStatuses(true), ['development', 'verified']);
  assert.equal(isEligibleForSessions('development', true), true);
  assert.equal(isEligibleForSessions('draft', true), false);
  assert.equal(isEligibleForSessions('retired', true), false);
  assert.deepEqual(
    filterEligibleQuestions(
      [
        { contentStatus: 'development' },
        { contentStatus: 'verified' },
      ],
      true,
    ),
    [{ contentStatus: 'development' }, { contentStatus: 'verified' }],
  );
});

test('developer include flag is ignored outside development builds', () => {
  assert.equal(resolveIncludeDevelopmentQuestions(false, true), false);
  assert.equal(resolveIncludeDevelopmentQuestions(true, false), false);
  assert.equal(resolveIncludeDevelopmentQuestions(false, false), false);
});

test('filterQuestionsByCertification keeps only the requested track', () => {
  assert.deepEqual(
    filterQuestionsByCertification(
      [
        { certificationId: 'az900' },
        { certificationId: 'dp900' },
        { certificationId: 'az900' },
      ],
      'az900',
    ),
    [{ certificationId: 'az900' }, { certificationId: 'az900' }],
  );
});
