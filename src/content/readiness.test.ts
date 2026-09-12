import assert from 'node:assert/strict';
import { test } from 'node:test';

import { determineLaunchReadiness } from '@/content/readiness';

test('launch readiness stays not_started without a verified blueprint', () => {
  assert.equal(
    determineLaunchReadiness({
      blueprintStatus: 'pending_verification',
      missingBlueprint: false,
      totals: { target: 350, verified: 0, draft: 0, remaining: 350, percentComplete: 0 },
      zeroCoverageObjectives: [],
      zeroCoverageSubobjectives: [],
      missingSourceIds: [],
      staleVerifiedIds: [],
    }).launchReadiness,
    'not_started',
  );
  assert.equal(
    determineLaunchReadiness({
      blueprintStatus: 'missing',
      missingBlueprint: true,
      totals: { target: 0, verified: 12, draft: 0, remaining: 0, percentComplete: 0 },
      zeroCoverageObjectives: [],
      zeroCoverageSubobjectives: [],
      missingSourceIds: [],
      staleVerifiedIds: [],
    }).launchReadiness,
    'not_started',
  );
});

test('verified blueprint with no questions is blueprint_ready', () => {
  assert.equal(
    determineLaunchReadiness({
      blueprintStatus: 'verified',
      missingBlueprint: false,
      totals: { target: 400, verified: 0, draft: 0, remaining: 400, percentComplete: 0 },
      zeroCoverageObjectives: ['Describe serverless'],
      zeroCoverageSubobjectives: [],
      missingSourceIds: [],
      staleVerifiedIds: [],
    }).launchReadiness,
    'blueprint_ready',
  );
});

test('raw question count cannot mark launch_ready while subobjectives are uncovered', () => {
  const result = determineLaunchReadiness({
    blueprintStatus: 'verified',
    missingBlueprint: false,
    totals: { target: 400, verified: 400, draft: 0, remaining: 0, percentComplete: 100 },
    zeroCoverageObjectives: [],
    zeroCoverageSubobjectives: ['Describe cloud computing · Describe serverless'],
    missingSourceIds: [],
    staleVerifiedIds: [],
  });
  assert.equal(result.launchReadiness, 'content_in_progress');
});

test('raw question count cannot mark launch_ready while objectives are uncovered', () => {
  const result = determineLaunchReadiness({
    blueprintStatus: 'verified',
    missingBlueprint: false,
    totals: { target: 400, verified: 400, draft: 0, remaining: 0, percentComplete: 100 },
    zeroCoverageObjectives: ['Describe serverless'],
    zeroCoverageSubobjectives: [],
    missingSourceIds: [],
    staleVerifiedIds: [],
  });
  assert.equal(result.launchReadiness, 'content_in_progress');
});

test('met target with uncovered-free blueprint but stale sources is qa_required', () => {
  assert.equal(
    determineLaunchReadiness({
      blueprintStatus: 'verified',
      missingBlueprint: false,
      totals: { target: 400, verified: 400, draft: 0, remaining: 0, percentComplete: 100 },
      zeroCoverageObjectives: [],
      zeroCoverageSubobjectives: [],
      missingSourceIds: [],
      staleVerifiedIds: ['az900-old'],
    }).launchReadiness,
    'qa_required',
  );
});

test('launch_ready requires verified blueprint, full coverage, and clean QA', () => {
  assert.equal(
    determineLaunchReadiness({
      blueprintStatus: 'verified',
      missingBlueprint: false,
      totals: { target: 400, verified: 400, draft: 0, remaining: 0, percentComplete: 100 },
      zeroCoverageObjectives: [],
      zeroCoverageSubobjectives: [],
      missingSourceIds: [],
      staleVerifiedIds: [],
    }).launchReadiness,
    'launch_ready',
  );
});
