import assert from 'node:assert/strict';
import { test } from 'node:test';

import { remainingFromDeadline, restoreRemainingSeconds, shouldExpire } from '@/lib/timer';

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

test('remainingFromDeadline uses the exam start timestamp, not an in-memory countdown', () => {
  const started = '2026-09-12T12:00:00.000Z';
  const now = Date.parse('2026-09-12T12:10:00.000Z');
  assert.equal(remainingFromDeadline(started, 45 * 60, now), 35 * 60);
  assert.equal(remainingFromDeadline(started, 45 * 60, Date.parse('2026-09-12T12:46:00.000Z')), 0);
  assert.equal(remainingFromDeadline('not-a-date', 45 * 60, now), 0);
});
