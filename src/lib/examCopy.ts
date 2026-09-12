import { EXAM_DURATION_SECONDS, EXAM_QUESTION_TARGET } from '@/lib/examBlueprint';

export function availableExamQuestionCount(
  bankSize: number,
  target: number = EXAM_QUESTION_TARGET,
): number {
  return Math.max(0, Math.min(bankSize, target));
}

export function mockExamSubtitle(
  bankSize: number,
  target: number = EXAM_QUESTION_TARGET,
): string {
  const count = availableExamQuestionCount(bankSize, target);
  const minutes = Math.round(EXAM_DURATION_SECONDS / 60);
  if (count <= 0) {
    return 'No questions available yet';
  }
  if (count < target) {
    return `${count} available questions · ${minutes}-minute timer`;
  }
  return `${target} questions · ${minutes}-minute timer`;
}
