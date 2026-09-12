import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { CONTENT_PRODUCTION_ORDER } from '@/content/blueprints/launchTargets';
import { OFFICIAL_BLUEPRINT_DOMAIN_IDS } from '@/content/blueprints/officialDomainIds';
import type { CertificationBlueprint } from '@/content/blueprints/types';
import { assertValidBlueprint } from '@/content/blueprints/validate';

test('official domain ids stay aligned with verified blueprints', () => {
  for (const id of CONTENT_PRODUCTION_ORDER) {
    const raw = JSON.parse(readFileSync(`content/blueprints/${id}.json`, 'utf8')) as unknown;
    assertValidBlueprint(raw, `${id}.json`);
    const blueprint = raw as CertificationBlueprint;
    assert.deepEqual(OFFICIAL_BLUEPRINT_DOMAIN_IDS[id], blueprint.domains.map((domain) => domain.id));
  }
});
