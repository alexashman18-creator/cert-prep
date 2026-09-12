import { AZ900_MOCK_EXAM, type MockExamConfig } from '@/certifications';
import type { Question } from '@/types/question';
import { shuffle, takeRandom } from '@/lib/shuffle';

export const EXAM_QUESTION_TARGET = AZ900_MOCK_EXAM.targetQuestionCount;
export const EXAM_DURATION_SECONDS = AZ900_MOCK_EXAM.examDurationMinutes * 60;
export const DOMAIN_WEIGHTS = AZ900_MOCK_EXAM.domainWeights;

export function durationSecondsFromConfig(config: MockExamConfig): number {
  return config.examDurationMinutes * 60;
}

export function allocateDomainCounts(
  total: number,
  weights: Record<string, number> = DOMAIN_WEIGHTS,
): Record<string, number> {
  const domainIds = Object.keys(weights);
  const raw = domainIds.map((domain) => {
    const exact = total * (weights[domain] ?? 0);
    return {
      domain,
      exact,
      base: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  const allocated = Object.fromEntries(domainIds.map((domain) => [domain, 0]));

  let used = 0;
  for (const item of raw) {
    allocated[item.domain] = item.base;
    used += item.base;
  }

  const leftover = total - used;
  const byRemainder = [...raw].sort((left, right) => right.remainder - left.remainder);
  for (let index = 0; index < leftover; index += 1) {
    const domain = byRemainder[index % byRemainder.length]?.domain;
    if (domain) {
      allocated[domain] += 1;
    }
  }

  return allocated;
}

function resolveExamSelection(
  targetOrConfig: number | MockExamConfig,
): { target: number; weights: Record<string, number> } {
  if (typeof targetOrConfig === 'number') {
    return { target: targetOrConfig, weights: DOMAIN_WEIGHTS };
  }
  return {
    target: targetOrConfig.targetQuestionCount,
    weights: targetOrConfig.domainWeights,
  };
}

export function selectExamQuestions(
  questions: Question[],
  targetOrConfig: number | MockExamConfig = EXAM_QUESTION_TARGET,
): Question[] {
  const { target, weights } = resolveExamSelection(targetOrConfig);
  const domainIds = Object.keys(weights);
  const available = new Map<string, Question[]>();
  for (const domain of domainIds) {
    available.set(
      domain,
      questions.filter((question) => question.domain === domain),
    );
  }

  const desired = allocateDomainCounts(target, weights);
  const selected: Question[] = [];

  for (const domain of domainIds) {
    const pool = available.get(domain) ?? [];
    const take = Math.min(desired[domain] ?? 0, pool.length);
    selected.push(...takeRandom(pool, take));
  }

  if (selected.length < target) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const leftovers = questions.filter((question) => !selectedIds.has(question.id));
    selected.push(...takeRandom(leftovers, target - selected.length));
  }

  return shuffle(selected);
}
