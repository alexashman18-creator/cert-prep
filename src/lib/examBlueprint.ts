import { DOMAIN_IDS, type DomainId } from '@/types/domain';
import type { Question } from '@/types/question';
import { shuffle, takeRandom } from '@/lib/shuffle';

export const EXAM_QUESTION_TARGET = 40;
export const EXAM_DURATION_SECONDS = 45 * 60;

export const DOMAIN_WEIGHTS: Record<DomainId, number> = {
  cloud_concepts: 0.27,
  architecture_services: 0.38,
  management_governance: 0.35,
};

export function allocateDomainCounts(total: number): Record<DomainId, number> {
  const raw = DOMAIN_IDS.map((domain) => {
    const exact = total * DOMAIN_WEIGHTS[domain];
    return {
      domain,
      exact,
      base: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  const allocated = Object.fromEntries(DOMAIN_IDS.map((domain) => [domain, 0])) as Record<
    DomainId,
    number
  >;

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

export function selectExamQuestions(
  questions: Question[],
  targetTotal: number = EXAM_QUESTION_TARGET,
): Question[] {
  const available = new Map<DomainId, Question[]>();
  for (const domain of DOMAIN_IDS) {
    available.set(
      domain,
      questions.filter((question) => question.domain === domain),
    );
  }

  const desired = allocateDomainCounts(targetTotal);
  const selected: Question[] = [];

  for (const domain of DOMAIN_IDS) {
    const pool = available.get(domain) ?? [];
    const take = Math.min(desired[domain], pool.length);
    selected.push(...takeRandom(pool, take));
  }

  if (selected.length < targetTotal) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const leftovers = questions.filter((question) => !selectedIds.has(question.id));
    selected.push(...takeRandom(leftovers, targetTotal - selected.length));
  }

  return shuffle(selected);
}
