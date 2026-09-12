import {
  DEFAULT_OVER_COVERED_RATIO,
  DEFAULT_STALE_DAYS,
  DEFAULT_UNDER_COVERED_RATIO,
} from '@/content/blueprints/launchTargets';
import type {
  BatchPriorityItem,
  BatchRecommendation,
  CertificationBlueprint,
  CoverageCounts,
  CoverageReport,
  DifficultyCoverage,
  DifficultyMix,
  DomainCoverage,
  NodeCoverage,
  ObjectiveCoverage,
  SubobjectiveCoverage,
} from '@/content/blueprints/types';
import { determineLaunchReadiness } from '@/content/readiness';
import { DIFFICULTIES, type Difficulty, type Question } from '@/types/question';

export type CoverageQuestion = Pick<
  Question,
  | 'id'
  | 'certificationId'
  | 'domain'
  | 'objective'
  | 'subobjective'
  | 'difficulty'
  | 'contentStatus'
  | 'sourceUrl'
  | 'sourceTitle'
  | 'verifiedDate'
>;

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function labelsMatch(node: { label: string; aliases?: string[] }, value: string): boolean {
  const needle = normalizeLabel(value);
  if (!needle) {
    return false;
  }
  return [node.label, ...(node.aliases ?? [])].some((label) => normalizeLabel(label) === needle);
}

function percentComplete(verified: number, target: number): number {
  if (target <= 0) {
    return verified > 0 ? 100 : 0;
  }
  return Math.round((verified / target) * 1000) / 10;
}

function coverageCounts(target: number, verified: number, draft: number): CoverageCounts {
  return {
    target,
    verified,
    draft,
    remaining: Math.max(0, target - verified),
    percentComplete: percentComplete(verified, target),
  };
}

function nodeFlags(
  counts: CoverageCounts,
  underCoveredRatio: number,
  overCoveredRatio: number,
): Pick<NodeCoverage, 'zeroCoverage' | 'underCovered' | 'overCovered'> {
  const ratio = counts.target > 0 ? counts.verified / counts.target : counts.verified > 0 ? 1 : 0;
  return {
    zeroCoverage: counts.target > 0 && counts.verified === 0,
    underCovered: counts.target > 0 && ratio < underCoveredRatio,
    overCovered: counts.target > 0 && ratio > overCoveredRatio,
  };
}

function isOlderThan(verifiedDate: string, staleDays: number, nowMs: number): boolean {
  const parsed = Date.parse(verifiedDate.length === 10 ? `${verifiedDate}T00:00:00.000Z` : verifiedDate);
  if (Number.isNaN(parsed)) {
    return true;
  }
  return nowMs - parsed > staleDays * 24 * 60 * 60 * 1000;
}

function hasSource(question: CoverageQuestion): boolean {
  return Boolean(question.sourceUrl?.trim() && question.sourceTitle?.trim());
}

interface MutableBucket {
  verified: number;
  draft: number;
}

function emptyBucket(): MutableBucket {
  return { verified: 0, draft: 0 };
}

function addStatus(bucket: MutableBucket, status: CoverageQuestion['contentStatus']): void {
  if (status === 'verified') {
    bucket.verified += 1;
  } else if (status === 'draft') {
    bucket.draft += 1;
  }
}

export function difficultyTargets(total: number, mix: DifficultyMix): Record<Difficulty, number> {
  const beginner = Math.round(total * mix.beginner);
  const intermediate = Math.round(total * mix.intermediate);
  const advanced = total - beginner - intermediate;
  return { beginner, intermediate, advanced };
}

export function buildCoverageReport(input: {
  blueprint: CertificationBlueprint | null;
  questions: readonly CoverageQuestion[];
  staleDays?: number;
  nowMs?: number;
  certificationId?: string;
  examCode?: string;
  displayName?: string;
}): CoverageReport {
  const staleDays = input.staleDays ?? DEFAULT_STALE_DAYS;
  const nowMs = input.nowMs ?? Date.now();
  const blueprint = input.blueprint;
  const underCoveredRatio = blueprint?.underCoveredRatio ?? DEFAULT_UNDER_COVERED_RATIO;
  const overCoveredRatio = blueprint?.overCoveredRatio ?? DEFAULT_OVER_COVERED_RATIO;

  const scoped = blueprint
    ? input.questions.filter((question) => question.certificationId === blueprint.certificationId)
    : input.questions.filter((question) => question.certificationId === input.certificationId);

  if (!blueprint) {
    const verified = scoped.filter((question) => question.contentStatus === 'verified').length;
    const draft = scoped.filter((question) => question.contentStatus === 'draft').length;
    const totals = coverageCounts(0, verified, draft);
    const emptyDifficulty = DIFFICULTIES.map((difficulty) => ({
      difficulty,
      ...coverageCounts(0, scoped.filter((question) => question.difficulty === difficulty && question.contentStatus === 'verified').length, 0),
    }));
    const report: CoverageReport = {
      certificationId: input.certificationId ?? scoped[0]?.certificationId ?? 'unknown',
      examCode: input.examCode ?? input.certificationId ?? 'unknown',
      displayName: input.displayName ?? input.examCode ?? 'Unknown certification',
      blueprintStatus: 'missing',
      skillsOutlineEffectiveDate: null,
      studyGuideUrl: null,
      missingBlueprint: true,
      totals,
      byDomain: [],
      byDifficulty: emptyDifficulty,
      unmappedVerifiedIds: scoped.filter((question) => question.contentStatus === 'verified').map((question) => question.id),
      unmappedDraftIds: scoped.filter((question) => question.contentStatus === 'draft').map((question) => question.id),
      zeroCoverageObjectives: [],
      zeroCoverageSubobjectives: [],
      underCoveredObjectives: [],
      overCoveredObjectives: [],
      missingSourceIds: scoped.filter((question) => question.contentStatus === 'verified' && !hasSource(question)).map((q) => q.id),
      staleVerifiedIds: scoped
        .filter(
          (question) =>
            question.contentStatus === 'verified' &&
            (!question.verifiedDate || isOlderThan(question.verifiedDate, staleDays, nowMs)),
        )
        .map((question) => question.id),
      staleDays,
      launchReadiness: 'not_started',
      launchReadinessReasons: [],
    };
    const readiness = determineLaunchReadiness(report);
    return { ...report, ...readiness };
  }

  const domainBuckets = new Map<string, MutableBucket>();
  const objectiveBuckets = new Map<string, MutableBucket>();
  const subBuckets = new Map<string, MutableBucket>();
  const difficultyBuckets = Object.fromEntries(DIFFICULTIES.map((item) => [item, emptyBucket()])) as Record<
    Difficulty,
    MutableBucket
  >;
  const unmappedVerifiedIds: string[] = [];
  const unmappedDraftIds: string[] = [];
  const missingSourceIds: string[] = [];
  const staleVerifiedIds: string[] = [];

  for (const domain of blueprint.domains) {
    domainBuckets.set(domain.id, emptyBucket());
    for (const objective of domain.objectives) {
      objectiveBuckets.set(`${domain.id}::${objective.id}`, emptyBucket());
      for (const subobjective of objective.subobjectives) {
        subBuckets.set(`${domain.id}::${objective.id}::${subobjective.id}`, emptyBucket());
      }
    }
  }

  for (const question of scoped) {
    if (question.contentStatus === 'verified') {
      if (!hasSource(question)) {
        missingSourceIds.push(question.id);
      }
      if (!question.verifiedDate || isOlderThan(question.verifiedDate, staleDays, nowMs)) {
        staleVerifiedIds.push(question.id);
      }
    }

    if (question.contentStatus === 'verified' || question.contentStatus === 'draft') {
      addStatus(difficultyBuckets[question.difficulty], question.contentStatus);
    }

    const domain = blueprint.domains.find((item) => item.id === question.domain);
    if (!domain) {
      if (question.contentStatus === 'verified') {
        unmappedVerifiedIds.push(question.id);
      } else if (question.contentStatus === 'draft') {
        unmappedDraftIds.push(question.id);
      }
      continue;
    }

    addStatus(domainBuckets.get(domain.id)!, question.contentStatus);

    let matchedObjective = domain.objectives.find((objective) =>
      objective.subobjectives.some((subobjective) => labelsMatch(subobjective, question.subobjective)),
    );
    let matchedSub = matchedObjective?.subobjectives.find((subobjective) =>
      labelsMatch(subobjective, question.subobjective),
    );
    if (!matchedObjective) {
      matchedObjective = domain.objectives.find((objective) => labelsMatch(objective, question.objective));
      matchedSub = undefined;
    }

    if (!matchedObjective) {
      if (question.contentStatus === 'verified') {
        unmappedVerifiedIds.push(question.id);
      } else if (question.contentStatus === 'draft') {
        unmappedDraftIds.push(question.id);
      }
      continue;
    }

    addStatus(objectiveBuckets.get(`${domain.id}::${matchedObjective.id}`)!, question.contentStatus);
    if (matchedSub) {
      addStatus(subBuckets.get(`${domain.id}::${matchedObjective.id}::${matchedSub.id}`)!, question.contentStatus);
    }
  }

  const byDomain: DomainCoverage[] = blueprint.domains.map((domain) => {
    const domainCounts = coverageCounts(
      domain.targetCount,
      domainBuckets.get(domain.id)?.verified ?? 0,
      domainBuckets.get(domain.id)?.draft ?? 0,
    );
    const objectives: ObjectiveCoverage[] = domain.objectives.map((objective) => {
      const key = `${domain.id}::${objective.id}`;
      const objectiveCounts = coverageCounts(
        objective.targetCount,
        objectiveBuckets.get(key)?.verified ?? 0,
        objectiveBuckets.get(key)?.draft ?? 0,
      );
      const subobjectives: SubobjectiveCoverage[] = objective.subobjectives.map((subobjective) => {
        const subKey = `${key}::${subobjective.id}`;
        const subCounts = coverageCounts(
          subobjective.targetCount,
          subBuckets.get(subKey)?.verified ?? 0,
          subBuckets.get(subKey)?.draft ?? 0,
        );
        return {
          id: subobjective.id,
          label: subobjective.label,
          ...subCounts,
          ...nodeFlags(subCounts, underCoveredRatio, overCoveredRatio),
        };
      });
      return {
        id: objective.id,
        label: objective.label,
        ...objectiveCounts,
        ...nodeFlags(objectiveCounts, underCoveredRatio, overCoveredRatio),
        subobjectives,
      };
    });
    return {
      id: domain.id,
      label: domain.label,
      weight: domain.weight,
      ...domainCounts,
      ...nodeFlags(domainCounts, underCoveredRatio, overCoveredRatio),
      objectives,
    };
  });

  const verified = scoped.filter((question) => question.contentStatus === 'verified').length;
  const draft = scoped.filter((question) => question.contentStatus === 'draft').length;
  const totals = coverageCounts(blueprint.contentTargetCount, verified, draft);
  const difficultyTarget = difficultyTargets(blueprint.contentTargetCount, blueprint.difficultyMix);
  const byDifficulty: DifficultyCoverage[] = DIFFICULTIES.map((difficulty) => ({
    difficulty,
    ...coverageCounts(
      difficultyTarget[difficulty],
      difficultyBuckets[difficulty].verified,
      difficultyBuckets[difficulty].draft,
    ),
  }));

  const zeroCoverageObjectives = byDomain.flatMap((domain) =>
    domain.objectives.filter((objective) => objective.zeroCoverage).map((objective) => objective.label),
  );
  const zeroCoverageSubobjectives = byDomain.flatMap((domain) =>
    domain.objectives.flatMap((objective) =>
      objective.subobjectives
        .filter((subobjective) => subobjective.zeroCoverage)
        .map((subobjective) => `${objective.label} · ${subobjective.label}`),
    ),
  );
  const underCoveredObjectives = byDomain.flatMap((domain) =>
    domain.objectives.filter((objective) => objective.underCovered).map((objective) => objective.label),
  );
  const overCoveredObjectives = byDomain.flatMap((domain) =>
    domain.objectives.filter((objective) => objective.overCovered).map((objective) => objective.label),
  );

  const report: CoverageReport = {
    certificationId: blueprint.certificationId,
    examCode: blueprint.examCode,
    displayName: blueprint.displayName,
    blueprintStatus: blueprint.blueprintStatus,
    skillsOutlineEffectiveDate: blueprint.skillsOutlineEffectiveDate,
    studyGuideUrl: blueprint.studyGuideUrl,
    missingBlueprint: false,
    totals,
    byDomain,
    byDifficulty,
    unmappedVerifiedIds,
    unmappedDraftIds,
    zeroCoverageObjectives,
    zeroCoverageSubobjectives,
    underCoveredObjectives,
    overCoveredObjectives,
    missingSourceIds,
    staleVerifiedIds,
    staleDays,
    launchReadiness: 'not_started',
    launchReadinessReasons: [],
  };
  const readiness = determineLaunchReadiness(report);
  return { ...report, ...readiness };
}

export function filterCoverageReport(report: CoverageReport, objectiveQuery: string): CoverageReport {
  const needle = normalizeLabel(objectiveQuery);
  const byDomain = report.byDomain
    .map((domain) => ({
      ...domain,
      objectives: domain.objectives.filter(
        (objective) =>
          normalizeLabel(objective.label) === needle ||
          normalizeLabel(objective.id) === needle ||
          normalizeLabel(domain.label) === needle ||
          normalizeLabel(domain.id) === needle,
      ),
    }))
    .filter((domain) => domain.objectives.length > 0);
  return { ...report, byDomain };
}

export function recommendNextBatch(report: CoverageReport, batchSize: number): BatchRecommendation {
  const candidates: BatchPriorityItem[] = [];

  for (const domain of report.byDomain) {
    for (const objective of domain.objectives) {
      const zeroSubs = objective.subobjectives.filter((item) => item.zeroCoverage && item.remaining > 0);
      const source = zeroSubs.length > 0 ? zeroSubs : objective.subobjectives.filter((item) => item.remaining > 0);
      if (source.length === 0 && objective.remaining > 0) {
        candidates.push({
          domainId: domain.id,
          domainLabel: domain.label,
          objectiveId: objective.id,
          objectiveLabel: objective.label,
          verified: objective.verified,
          target: objective.target,
          remaining: objective.remaining,
          suggestedCount: 0,
          reason: objective.zeroCoverage ? 'zero_coverage' : objective.underCovered ? 'under_covered' : 'remaining',
        });
        continue;
      }
      for (const subobjective of source) {
        candidates.push({
          domainId: domain.id,
          domainLabel: domain.label,
          objectiveId: objective.id,
          objectiveLabel: objective.label,
          subobjectiveId: subobjective.id,
          subobjectiveLabel: subobjective.label,
          verified: subobjective.verified,
          target: subobjective.target,
          remaining: subobjective.remaining,
          suggestedCount: 0,
          reason: subobjective.zeroCoverage ? 'zero_coverage' : subobjective.underCovered ? 'under_covered' : 'remaining',
        });
      }
    }
  }

  const rank = (item: BatchPriorityItem): number => {
    if (item.reason === 'zero_coverage') {
      return 0;
    }
    if (item.reason === 'under_covered') {
      return 1;
    }
    return 2;
  };

  candidates.sort((left, right) => {
    const rankDelta = rank(left) - rank(right);
    if (rankDelta !== 0) {
      return rankDelta;
    }
    const leftRatio = left.target > 0 ? left.verified / left.target : 1;
    const rightRatio = right.target > 0 ? right.verified / right.target : 1;
    if (leftRatio !== rightRatio) {
      return leftRatio - rightRatio;
    }
    return right.remaining - left.remaining;
  });

  let remainingSlots = batchSize;
  const items: BatchPriorityItem[] = [];
  for (const item of candidates) {
    if (remainingSlots <= 0) {
      break;
    }
    const suggestedCount = Math.min(item.remaining, remainingSlots);
    if (suggestedCount <= 0) {
      continue;
    }
    items.push({ ...item, suggestedCount });
    remainingSlots -= suggestedCount;
  }

  return {
    certificationId: report.certificationId,
    examCode: report.examCode,
    batchSize,
    remainingToTarget: report.totals.remaining,
    items,
  };
}
