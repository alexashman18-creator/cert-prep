import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CONTENT_PRODUCTION_ORDER, LAUNCH_CONTENT_TARGETS } from '@/content/blueprints/launchTargets';
import type { CertificationBlueprint } from '@/content/blueprints/types';
import { assertValidBlueprint, validateCertificationBlueprint } from '@/content/blueprints/validate';

function loadBlueprint(id: string): CertificationBlueprint {
  const raw = JSON.parse(readFileSync(`content/blueprints/${id}.json`, 'utf8')) as unknown;
  assertValidBlueprint(raw, `${id}.json`);
  return raw;
}

test('AZ-900 target count is 400 and the verified blueprint sums correctly', () => {
  const blueprint = loadBlueprint('az900');
  assert.equal(blueprint.certificationId, 'az900');
  assert.equal(blueprint.blueprintStatus, 'verified');
  assert.equal(blueprint.contentTargetCount, 400);
  assert.equal(LAUNCH_CONTENT_TARGETS.az900, 400);
  assert.equal(
    blueprint.domains.reduce((sum, domain) => sum + domain.targetCount, 0),
    400,
  );
  assert.deepEqual(
    Object.fromEntries(blueprint.domains.map((domain) => [domain.id, domain.targetCount])),
    {
      cloud_concepts: 108,
      architecture_services: 152,
      management_governance: 140,
    },
  );
});

test('every configured certification has a verified blueprint and official domains', () => {
  let configuredTarget = 0;
  for (const id of CONTENT_PRODUCTION_ORDER) {
    const blueprint = loadBlueprint(id);
    assert.equal(blueprint.certificationId, id);
    assert.equal(blueprint.examCode.replaceAll('-', '').toLowerCase(), id);
    assert.equal(blueprint.blueprintStatus, 'verified');
    assert.equal(blueprint.contentTargetCount, LAUNCH_CONTENT_TARGETS[id]);
    assert.ok(blueprint.domains.length > 0, `${id} must include official domains`);
    assert.equal(
      blueprint.domains.reduce((sum, domain) => sum + domain.targetCount, 0),
      blueprint.contentTargetCount,
    );
    configuredTarget += blueprint.contentTargetCount;
    for (const domain of blueprint.domains) {
      assert.ok(domain.label.length > 0);
      assert.ok(domain.objectives.length > 0, `${id} domain ${domain.id} must have official objectives`);
      for (const objective of domain.objectives) {
        assert.ok(
          objective.subobjectives.length > 0,
          `${id} objective ${objective.id} must have official subobjectives`,
        );
      }
    }
  }
  assert.equal(configuredTarget, 4950);
});

test('official objectives stay inside a single certification blueprint', () => {
  const owners = new Map<string, string>();
  for (const id of CONTENT_PRODUCTION_ORDER) {
    const blueprint = loadBlueprint(id);
    for (const domain of blueprint.domains) {
      for (const objective of domain.objectives) {
        const existing = owners.get(objective.label);
        assert.ok(
          !existing || existing === blueprint.examCode,
          `Objective "${objective.label}" belongs to both ${existing} and ${blueprint.examCode}`,
        );
        owners.set(objective.label, blueprint.examCode);
      }
    }
  }
  const az900 = loadBlueprint('az900');
  assert.equal(az900.skillsOutlineEffectiveDate, '2026-07-20');
  assert.equal(
    az900.studyGuideUrl,
    'https://learn.microsoft.com/credentials/certifications/resources/study-guides/az-900',
  );
  assert.equal(az900.domains.length, 3);
});

test('pending_verification blueprints reject invented domains', () => {
  const issues = validateCertificationBlueprint({
    schemaVersion: 1,
    certificationId: 'dp900',
    examCode: 'DP-900',
    displayName: 'Azure Data Fundamentals',
    blueprintStatus: 'pending_verification',
    skillsOutlineEffectiveDate: null,
    studyGuideUrl: null,
    contentTargetCount: 350,
    difficultyMix: { beginner: 0.55, intermediate: 0.35, advanced: 0.1 },
    underCoveredRatio: 0.4,
    overCoveredRatio: 1.25,
    domains: [{ id: 'guessed', label: 'Guessed', weight: 1, targetCount: 350, objectives: [] }],
  });
  assert.ok(issues.some((issue) => issue.message.includes('must not invent domains')));
});
