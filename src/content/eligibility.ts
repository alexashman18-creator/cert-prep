import type { ContentStatus, Question } from '@/types/question';

/**
 * DEV-only override. When this is true *and* the app is a development build
 * (`__DEV__ === true`), new Practice / Mock Exam sessions and user-facing bank
 * counts include the bundled development samples.
 *
 * Default: false. Expo Go and other development builds match production:
 * verified questions only.
 *
 * Production builds (`__DEV__ === false`) ignore this flag. Do not add a
 * user-facing toggle for it.
 */
export const INCLUDE_DEVELOPMENT_QUESTIONS = false;

export function isDevelopmentBuild(): boolean {
  return typeof __DEV__ !== 'undefined' && __DEV__ === true;
}

export function resolveIncludeDevelopmentQuestions(
  isDevBuild: boolean,
  includeDevelopmentFlag: boolean = INCLUDE_DEVELOPMENT_QUESTIONS,
): boolean {
  return isDevBuild && includeDevelopmentFlag;
}

export function shouldIncludeDevelopmentQuestions(): boolean {
  return resolveIncludeDevelopmentQuestions(isDevelopmentBuild());
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
