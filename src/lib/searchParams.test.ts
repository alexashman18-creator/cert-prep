import assert from 'node:assert/strict';
import { test } from 'node:test';

import { firstParam } from '@/lib/searchParams';

test('firstParam unwraps Expo Router array params', () => {
  assert.equal(firstParam(['abc', 'def']), 'abc');
  assert.equal(firstParam('abc'), 'abc');
  assert.equal(firstParam(undefined), undefined);
});
