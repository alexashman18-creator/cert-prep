import type { Difficulty } from '@/types/question';

export const BLUEPRINT_SCHEMA_VERSION = 1;
export const BLUEPRINT_STATUSES = ['pending_verification', 'verified', 'retired'] as const;
export type BlueprintStatus = (typeof BLUEPRINT_STATUSES)[number];

export const LAUNCH_READINESS_STATUSES = [
  'not_started',
  'blueprint_ready',
  'content_in_progress',
  'qa_required',
  'launch_ready',
] as const;
export type LaunchReadinessStatus = (typeof LAUNCH_READINESS_STATUSES)[number];

export interface DifficultyMix {
  beginner: number;
  intermediate: number;
  advanced: number;
}

export interface BlueprintSubobjective {
  id: string;
  label: string;
  targetCount: number;
  aliases?: string[];
}

export interface BlueprintObjective {
  id: string;
  label: string;
  targetCount: number;
  aliases?: string[];
  subobjectives: BlueprintSubobjective[];
}

export interface BlueprintDomain {
  id: string;
  label: string;
  weight: number;
  /** Official Microsoft study-guide weighting range, e.g. "25–30%". */
  weightRange?: string;
  targetCount: number;
  objectives: BlueprintObjective[];
}

export interface BlueprintSourceMetadata {
  verifiedDate: string;
  studyGuideUrl: string;
  examUrl?: string | null;
  certificationUrl?: string | null;
  examDurationDocumentationUrl?: string;
  skillsOutlineQuotedAsOf: string | null;
  officialExamDurationMinutes?: number | null;
  officialQuestionRange?: string | null;
  notes?: string[];
}

export interface CertificationBlueprint {
  schemaVersion: number;
  certificationId: string;
  examCode: string;
  displayName: string;
  blueprintStatus: BlueprintStatus;
  skillsOutlineEffectiveDate: string | null;
  studyGuideUrl: string | null;
  examUrl?: string | null;
  certificationUrl?: string | null;
  officialExamDurationMinutes?: number | null;
  officialQuestionRange?: string | null;
  /** Clarifies that contentTargetCount is our bank target, not Microsoft's exam length. */
  contentTargetKind?: 'internal_content_bank';
  contentTargetCount: number;
  difficultyMix: DifficultyMix;
  underCoveredRatio: number;
  overCoveredRatio: number;
  source?: BlueprintSourceMetadata;
  domains: BlueprintDomain[];
}

export interface CoverageCounts {
  target: number;
  verified: number;
  draft: number;
  remaining: number;
  percentComplete: number;
}

export interface DifficultyCoverage extends CoverageCounts {
  difficulty: Difficulty;
}

export interface NodeCoverage extends CoverageCounts {
  id: string;
  label: string;
  zeroCoverage: boolean;
  underCovered: boolean;
  overCovered: boolean;
}

export type SubobjectiveCoverage = NodeCoverage;

export interface ObjectiveCoverage extends NodeCoverage {
  subobjectives: SubobjectiveCoverage[];
}

export interface DomainCoverage extends NodeCoverage {
  weight: number;
  objectives: ObjectiveCoverage[];
}

export interface BatchPriorityItem {
  domainId: string;
  domainLabel: string;
  objectiveId: string;
  objectiveLabel: string;
  subobjectiveId?: string;
  subobjectiveLabel?: string;
  verified: number;
  target: number;
  remaining: number;
  suggestedCount: number;
  reason: 'zero_coverage' | 'under_covered' | 'remaining';
}

export interface BatchRecommendation {
  certificationId: string;
  examCode: string;
  batchSize: number;
  remainingToTarget: number;
  items: BatchPriorityItem[];
}

export interface CoverageReport {
  certificationId: string;
  examCode: string;
  displayName: string;
  blueprintStatus: BlueprintStatus | 'missing';
  skillsOutlineEffectiveDate: string | null;
  studyGuideUrl: string | null;
  missingBlueprint: boolean;
  totals: CoverageCounts;
  byDomain: DomainCoverage[];
  byDifficulty: DifficultyCoverage[];
  unmappedVerifiedIds: string[];
  unmappedDraftIds: string[];
  zeroCoverageObjectives: string[];
  zeroCoverageSubobjectives: string[];
  underCoveredObjectives: string[];
  overCoveredObjectives: string[];
  missingSourceIds: string[];
  staleVerifiedIds: string[];
  staleDays: number;
  launchReadiness: LaunchReadinessStatus;
  launchReadinessReasons: string[];
}

export interface PlatformCoverageSummary {
  certifications: CoverageReport[];
  launchTargets: Record<string, number>;
  productionOrder: string[];
}
