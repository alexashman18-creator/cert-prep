import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import type { CertificationBlueprint } from '@/content/blueprints/types';
import { assertValidBlueprint } from '@/content/blueprints/validate';
import {
  buildCoverageReport,
  difficultyTargets,
  filterCoverageReport,
  recommendNextBatch,
} from '@/content/coverage';
import { mapSourceQuestions } from '@/content/mapSource';
import type { QuestionBankFile } from '@/content/types';
import type { Question } from '@/types/question';

const question = (overrides: Partial<Question>): Question => ({
  id: 'q1',
  certificationId: 'az900',
  examVersion: 'AZ-900-2026-07',
  domain: 'cloud_concepts',
  objective: 'Describe cloud computing',
  subobjective: 'Describe serverless',
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
  sourceUrl: 'https://learn.microsoft.com/azure',
  sourceTitle: 'Learn',
  verifiedDate: '2026-09-12',
  questionVersion: 1,
  contentStatus: 'verified',
  ...overrides,
});

const miniBlueprint: CertificationBlueprint = {
  schemaVersion: 1,
  certificationId: 'az900',
  examCode: 'AZ-900',
  displayName: 'Azure Fundamentals',
  blueprintStatus: 'verified',
  skillsOutlineEffectiveDate: '2026-07-20',
  studyGuideUrl: 'https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900',
  contentTargetCount: 10,
  difficultyMix: { beginner: 0.5, intermediate: 0.3, advanced: 0.2 },
  underCoveredRatio: 0.4,
  overCoveredRatio: 1.25,
  domains: [
    {
      id: 'cloud_concepts',
      label: 'Cloud Concepts',
      weight: 1,
      targetCount: 10,
      objectives: [
        {
          id: 'describe_cloud_computing',
          label: 'Describe cloud computing',
          targetCount: 6,
          subobjectives: [
            { id: 'serverless', label: 'Describe serverless', targetCount: 3 },
            { id: 'shared', label: 'Describe the shared responsibility model', targetCount: 3 },
          ],
        },
        {
          id: 'describe_cloud_service_types',
          label: 'Describe cloud service types',
          targetCount: 4,
          subobjectives: [{ id: 'iaas', label: 'Describe infrastructure as a service (IaaS)', targetCount: 4 }],
        },
      ],
    },
  ],
};

function loadAz900(): { blueprint: CertificationBlueprint; questions: Question[] } {
  const blueprintRaw = JSON.parse(readFileSync('content/blueprints/az900.json', 'utf8')) as unknown;
  assertValidBlueprint(blueprintRaw);
  const batch = JSON.parse(readFileSync('content/questions/batches/az900/batch-001.json', 'utf8')) as QuestionBankFile;
  return {
    blueprint: blueprintRaw,
    questions: mapSourceQuestions(batch.questions, batch),
  };
}

test('AZ-900 current verified count is 50 against a 400 target', () => {
  const { blueprint, questions } = loadAz900();
  const report = buildCoverageReport({
    blueprint,
    questions,
    nowMs: Date.parse('2026-09-12T00:00:00.000Z'),
  });
  assert.equal(blueprint.contentTargetCount, 400);
  assert.equal(questions.length, 50);
  assert.equal(report.totals.verified, 50);
  assert.equal(report.totals.draft, 0);
  assert.equal(report.totals.target, 400);
  assert.equal(report.totals.remaining, 350);
  assert.equal(report.totals.percentComplete, 12.5);
  assert.equal(report.launchReadiness, 'content_in_progress');
  assert.equal(report.unmappedVerifiedIds.length, 0);
});

test('AZ-900 domain coverage matches the first production batch', () => {
  const { blueprint, questions } = loadAz900();
  const report = buildCoverageReport({ blueprint, questions });
  const byId = Object.fromEntries(report.byDomain.map((domain) => [domain.id, domain.verified]));
  assert.equal(byId.cloud_concepts, 15);
  assert.equal(byId.architecture_services, 20);
  assert.equal(byId.management_governance, 15);
});

test('coverage aggregates objectives, subobjectives, and difficulty', () => {
  const report = buildCoverageReport({
    blueprint: miniBlueprint,
    questions: [
      question({ id: 'v1', subobjective: 'Describe serverless', difficulty: 'beginner' }),
      question({ id: 'v2', subobjective: 'Describe serverless', difficulty: 'intermediate' }),
      question({
        id: 'd1',
        subobjective: 'Describe the shared responsibility model',
        contentStatus: 'draft',
        difficulty: 'advanced',
      }),
    ],
  });

  const computing = report.byDomain[0]?.objectives.find((item) => item.id === 'describe_cloud_computing');
  const serverless = computing?.subobjectives.find((item) => item.id === 'serverless');
  const types = report.byDomain[0]?.objectives.find((item) => item.id === 'describe_cloud_service_types');
  assert.equal(computing?.verified, 2);
  assert.equal(computing?.draft, 1);
  assert.equal(serverless?.verified, 2);
  assert.equal(types?.verified, 0);
  assert.ok(types?.zeroCoverage);
  assert.deepEqual(report.zeroCoverageObjectives, ['Describe cloud service types']);
  assert.equal(report.byDifficulty.find((item) => item.difficulty === 'beginner')?.verified, 1);
  assert.equal(report.byDifficulty.find((item) => item.difficulty === 'intermediate')?.verified, 1);
  assert.equal(report.byDifficulty.find((item) => item.difficulty === 'advanced')?.draft, 1);
  assert.deepEqual(difficultyTargets(10, miniBlueprint.difficultyMix), {
    beginner: 5,
    intermediate: 3,
    advanced: 2,
  });
});

test('missing-blueprint handling does not invent official coverage', () => {
  const report = buildCoverageReport({
    blueprint: null,
    certificationId: 'dp900',
    examCode: 'DP-900',
    displayName: 'Azure Data Fundamentals',
    questions: [question({ id: 'stray', certificationId: 'dp900' })],
  });
  assert.equal(report.missingBlueprint, true);
  assert.equal(report.blueprintStatus, 'missing');
  assert.equal(report.launchReadiness, 'not_started');
  assert.deepEqual(report.byDomain, []);
  assert.deepEqual(report.unmappedVerifiedIds, ['stray']);
});

test('coverage isolates certifications from one another', () => {
  const report = buildCoverageReport({
    blueprint: miniBlueprint,
    questions: [
      question({ id: 'az', subobjective: 'Describe serverless' }),
      question({ id: 'dp', certificationId: 'dp900', domain: 'core_data', objective: 'Data', subobjective: 'Concepts' }),
    ],
  });
  assert.equal(report.totals.verified, 1);
  assert.ok(!report.unmappedVerifiedIds.includes('dp'));
});

test('objective filter and batch recommendation prioritise zero-coverage topics', () => {
  const report = buildCoverageReport({
    blueprint: miniBlueprint,
    questions: [question({ id: 'v1', subobjective: 'Describe serverless' })],
  });
  const filtered = filterCoverageReport(report, 'Describe cloud computing');
  assert.equal(filtered.byDomain.length, 1);
  const recommendation = recommendNextBatch(report, 4);
  assert.ok(recommendation.items.length > 0);
  assert.equal(recommendation.items[0]?.reason, 'zero_coverage');
  assert.equal(
    recommendation.items.reduce((sum, item) => sum + item.suggestedCount, 0),
    4,
  );
});

test('over-covered objectives are flagged against their target', () => {
  const report = buildCoverageReport({
    blueprint: miniBlueprint,
    questions: [
      question({ id: '1', subobjective: 'Describe serverless' }),
      question({ id: '2', subobjective: 'Describe serverless' }),
      question({ id: '3', subobjective: 'Describe serverless' }),
      question({ id: '4', subobjective: 'Describe serverless' }),
    ],
  });
  const serverless = report.byDomain[0]?.objectives[0]?.subobjectives[0];
  assert.equal(serverless?.verified, 4);
  assert.ok(serverless?.overCovered);
});
