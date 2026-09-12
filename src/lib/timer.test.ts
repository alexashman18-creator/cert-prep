import assert from 'node:assert/strict';
import { test } from 'node:test';

import { restoreRemainingSeconds, shouldExpire } from '@/lib/timer';

test('restoreRemainingSeconds subtracts elapsed wall time', () => {
  const lastTick = Date.parse('2026-09-12T12:00:00.000Z');
  const now = Date.parse('2026-09-12T12:10:00.000Z');
  assert.equal(restoreRemainingSeconds(20 * 60, new Date(lastTick).toISOString(), now), 10 * 60);
});

test('restoreRemainingSeconds never goes below zero', () => {
  const lastTick = '2026-09-12T12:00:00.000Z';
  const now = Date.parse('2026-09-12T13:00:00.000Z');
  assert.equal(restoreRemainingSeconds(90, lastTick, now), 0);
  assert.equal(shouldExpire(0), true);
});

test('restoreRemainingSeconds does not reset to a full 45-minute exam', () => {
  const lastTick = '2026-09-12T12:40:00.000Z';
  const now = Date.parse('2026-09-12T12:42:00.000Z');
  const restored = restoreRemainingSeconds(20 * 60, lastTick, now);
  assert.equal(restored, 18 * 60);
  assert.notEqual(restored, 45 * 60);
});
