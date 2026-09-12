import { AZ900_MOCK_EXAM, type MockExamConfig } from '@/certifications';

export function availableExamQuestionCount(
  bankSize: number,
  target: number = AZ900_MOCK_EXAM.targetQuestionCount,
): number {
  return Math.max(0, Math.min(bankSize, target));
}

export function mockExamSubtitle(
  bankSize: number,
  targetOrConfig: number | Pick<MockExamConfig, 'targetQuestionCount' | 'examDurationMinutes'> = AZ900_MOCK_EXAM,
): string {
  const target =
    typeof targetOrConfig === 'number' ? targetOrConfig : targetOrConfig.targetQuestionCount;
  const minutes =
    typeof targetOrConfig === 'number'
      ? AZ900_MOCK_EXAM.examDurationMinutes
      : targetOrConfig.examDurationMinutes;
  const count = availableExamQuestionCount(bankSize, target);
  if (count <= 0) {
    return 'No questions available yet';
  }
  if (count < target) {
    return `${count} available questions · ${minutes}-minute timer`;
  }
  return `${target} questions · ${minutes}-minute timer`;
}
