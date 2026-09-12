import type { Question } from '@/types/question';
import { CONTENT_STATUSES, DIFFICULTIES } from '@/types/question';
import { DOMAIN_IDS } from '@/types/domain';

export interface QuestionBankAudit {
  total: number;
  byStatus: Record<(typeof CONTENT_STATUSES)[number], number>;
  byDomain: Record<(typeof DOMAIN_IDS)[number], number>;
  byObjective: Record<string, number>;
  byDifficulty: Record<(typeof DIFFICULTIES)[number], number>;
  missingSource: string[];
  staleVerifiedIds: string[];
  staleDays: number;
}

function increment(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function hasSourceInformation(question: Question): boolean {
  return Boolean(question.sourceUrl.trim() && question.sourceTitle.trim());
}

function isOlderThan(verifiedDate: string, staleDays: number, nowMs: number): boolean {
  const parsed = Date.parse(verifiedDate.length === 10 ? `${verifiedDate}T00:00:00.000Z` : verifiedDate);
  if (Number.isNaN(parsed)) {
    return true;
  }
  return nowMs - parsed > staleDays * 24 * 60 * 60 * 1000;
}

export function auditQuestionBank(
  questions: readonly Question[],
  options?: { staleDays?: number; nowMs?: number },
): QuestionBankAudit {
  const staleDays = options?.staleDays ?? 180;
  const nowMs = options?.nowMs ?? Date.now();

  const byStatus = Object.fromEntries(CONTENT_STATUSES.map((status) => [status, 0])) as QuestionBankAudit['byStatus'];
  const byDomain = Object.fromEntries(DOMAIN_IDS.map((domain) => [domain, 0])) as QuestionBankAudit['byDomain'];
  const byDifficulty = Object.fromEntries(
    DIFFICULTIES.map((difficulty) => [difficulty, 0]),
  ) as QuestionBankAudit['byDifficulty'];
  const byObjective: Record<string, number> = {};
  const missingSource: string[] = [];
  const staleVerifiedIds: string[] = [];

  for (const question of questions) {
    increment(byStatus, question.contentStatus);
    increment(byDomain, question.domain);
    increment(byDifficulty, question.difficulty);
    increment(byObjective, question.objective);

    if (!hasSourceInformation(question)) {
      missingSource.push(question.id);
    }
    if (
      question.contentStatus === 'verified' &&
      (!question.verifiedDate || isOlderThan(question.verifiedDate, staleDays, nowMs))
    ) {
      staleVerifiedIds.push(question.id);
    }
  }

  return {
    total: questions.length,
    byStatus,
    byDomain,
    byObjective,
    byDifficulty,
    missingSource,
    staleVerifiedIds,
    staleDays,
  };
}

export function formatQuestionBankAudit(audit: QuestionBankAudit): string {
  const objectiveLines = Object.entries(audit.byObjective)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([objective, count]) => `  ${objective}: ${count}`)
    .join('\n');

  return [
    `Total questions: ${audit.total}`,
    `Verified: ${audit.byStatus.verified}`,
    `Draft: ${audit.byStatus.draft}`,
    `Development: ${audit.byStatus.development}`,
    `Retired: ${audit.byStatus.retired}`,
    'By domain:',
    `  cloud_concepts: ${audit.byDomain.cloud_concepts}`,
    `  architecture_services: ${audit.byDomain.architecture_services}`,
    `  management_governance: ${audit.byDomain.management_governance}`,
    'By difficulty:',
    `  beginner: ${audit.byDifficulty.beginner}`,
    `  intermediate: ${audit.byDifficulty.intermediate}`,
    `  advanced: ${audit.byDifficulty.advanced}`,
    'By objective:',
    objectiveLines || '  (none)',
    `Missing source information: ${audit.missingSource.length}`,
    audit.missingSource.length ? `  ${audit.missingSource.join(', ')}` : '',
    `Verified dates older than ${audit.staleDays} days, or missing: ${audit.staleVerifiedIds.length}`,
    audit.staleVerifiedIds.length ? `  ${audit.staleVerifiedIds.join(', ')}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
