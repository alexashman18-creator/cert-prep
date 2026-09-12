import type { ContentStatus, Question } from '@/types/question';

export function shouldIncludeDevelopmentQuestions(): boolean {
  return typeof __DEV__ === 'undefined' ? true : __DEV__;
}

export function sessionEligibleStatuses(
  includeDevelopment: boolean = shouldIncludeDevelopmentQuestions(),
): ContentStatus[] {
  return includeDevelopment ? ['development', 'verified'] : ['verified'];
}

export function isEligibleForSessions(
  status: ContentStatus,
  includeDevelopment: boolean = shouldIncludeDevelopmentQuestions(),
): boolean {
  if (status === 'verified') {
    return true;
  }
  return includeDevelopment && status === 'development';
}

export function filterEligibleQuestions<T extends Pick<Question, 'contentStatus'>>(
  questions: readonly T[],
  includeDevelopment: boolean = shouldIncludeDevelopmentQuestions(),
): T[] {
  return questions.filter((question) =>
    isEligibleForSessions(question.contentStatus, includeDevelopment),
  );
}

export function filterQuestionsByCertification<T extends Pick<Question, 'certificationId'>>(
  questions: readonly T[],
  certificationId: string,
): T[] {
  return questions.filter((question) => question.certificationId === certificationId);
}
