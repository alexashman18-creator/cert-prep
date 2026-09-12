export function restoreRemainingSeconds(
  persistedRemaining: number,
  lastTickAtIso: string,
  nowMs: number = Date.now(),
): number {
  const lastTick = Date.parse(lastTickAtIso);
  if (Number.isNaN(lastTick)) {
    return Math.max(0, persistedRemaining);
  }
  const elapsedSeconds = Math.floor((nowMs - lastTick) / 1000);
  return Math.max(0, persistedRemaining - elapsedSeconds);
}

export function remainingFromDeadline(
  startedAtIso: string,
  durationSeconds: number,
  nowMs: number = Date.now(),
): number {
  const started = Date.parse(startedAtIso);
  if (Number.isNaN(started) || durationSeconds <= 0) {
    return 0;
  }
  const elapsedSeconds = Math.floor((nowMs - started) / 1000);
  return Math.max(0, durationSeconds - elapsedSeconds);
}

export function shouldExpire(remainingSeconds: number): boolean {
  return remainingSeconds <= 0;
}
