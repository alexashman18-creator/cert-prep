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

export function shouldExpire(remainingSeconds: number): boolean {
  return remainingSeconds <= 0;
}
