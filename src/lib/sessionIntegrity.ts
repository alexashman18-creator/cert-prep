import type { Question } from '@/types/question';
import type { SessionStatus } from '@/types/session';

export function isResumableStatus(status: SessionStatus): boolean {
  return status === 'in_progress';
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return Math.min(Math.max(index, 0), length - 1);
}

export function alignSessionQuestions(
  requestedIds: string[],
  loaded: Question[],
  currentIndex: number,
): { questions: Question[]; currentIndex: number; missingCount: number } {
  const byId = new Map(loaded.map((question) => [question.id, question]));
  const questions = requestedIds
    .map((id) => byId.get(id))
    .filter((question): question is Question => question !== undefined);
  const currentId = requestedIds[currentIndex];
  const alignedIndex = currentId
    ? questions.findIndex((question) => question.id === currentId)
    : 0;

  return {
    questions,
    currentIndex: clampIndex(alignedIndex === -1 ? 0 : alignedIndex, questions.length),
    missingCount: requestedIds.length - questions.length,
  };
}

export function selectPracticeQuestionIds(
  availableIds: readonly string[],
  requestedCount: number,
): string[] {
  const count = Math.max(0, Math.min(requestedCount, availableIds.length));
  const next = [...availableIds];
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
  return next.slice(0, count);
}
