import type { Question } from '@/types/question';
import { CONTENT_STATUSES, DIFFICULTIES } from '@/types/question';

export interface QuestionBankAudit {
  certificationId?: string;
  examCode?: string;
  total: number;
  byStatus: Record<(typeof CONTENT_STATUSES)[number], number>;
  byDomain: Record<string, number>;
  byObjective: Record<string, number>;
  byDifficulty: Record<(typeof DIFFICULTIES)[number], number>;
  missingSource: string[];
  staleVerifiedIds: string[];
  staleDays: number;
}

export interface PlatformQuestionBankAudit {
  total: number;
  byCertification: Record<string, number>;
  audits: QuestionBankAudit[];
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
  options?: { staleDays?: number; nowMs?: number; certificationId?: string; examCode?: string },
): QuestionBankAudit {
  const staleDays = options?.staleDays ?? 180;
  const nowMs = options?.nowMs ?? Date.now();

  const byStatus = Object.fromEntries(CONTENT_STATUSES.map((status) => [status, 0])) as QuestionBankAudit['byStatus'];
  const byDomain: Record<string, number> = {};
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
    certificationId: options?.certificationId,
    examCode: options?.examCode,
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

export function auditQuestionBankByCertification(
  questions: readonly Question[],
  options?: { staleDays?: number; nowMs?: number },
): PlatformQuestionBankAudit {
  const byCertification: Record<string, number> = {};
  const grouped = new Map<string, Question[]>();

  for (const question of questions) {
    const key = question.certificationId;
    increment(byCertification, key);
    const list = grouped.get(key) ?? [];
    list.push(question);
    grouped.set(key, list);
  }

  const audits = [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([certificationId, items]) =>
      auditQuestionBank(items, { ...options, certificationId }),
    );

  return {
    total: questions.length,
    byCertification,
    audits,
  };
}

export function formatQuestionBankAudit(audit: QuestionBankAudit): string {
  const heading = audit.examCode ?? audit.certificationId;
  const domainLines = Object.entries(audit.byDomain)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([domain, count]) => `  ${domain}: ${count}`)
    .join('\n');
  const objectiveLines = Object.entries(audit.byObjective)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([objective, count]) => `  ${objective}: ${count}`)
    .join('\n');

  return [
    heading ? `${heading}` : '',
    `Total questions: ${audit.total}`,
    `Verified: ${audit.byStatus.verified}`,
    `Draft: ${audit.byStatus.draft}`,
    `Development: ${audit.byStatus.development}`,
    `Retired: ${audit.byStatus.retired}`,
    'By domain:',
    domainLines || '  (none)',
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

export function formatPlatformQuestionBankAudit(platform: PlatformQuestionBankAudit): string {
  const certLines = Object.entries(platform.byCertification)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, count]) => `  ${id}: ${count}`)
    .join('\n');
  const sections = platform.audits.map((audit) => formatQuestionBankAudit(audit)).join('\n\n');
  return [
    `Platform total: ${platform.total}`,
    'By certification:',
    certLines || '  (none)',
    sections ? `\n${sections}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}
