export function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapWith = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    const other = next[swapWith];
    if (current === undefined || other === undefined) {
      continue;
    }
    next[index] = other;
    next[swapWith] = current;
  }
  return next;
}

export function takeRandom<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.max(0, Math.min(count, items.length)));
}
