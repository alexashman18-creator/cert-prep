import type { DifficultyLevel } from '@/certifications';
import type { DifficultyMix } from '@/content/blueprints/types';

/** Content-planning production order. Launch still targets every configured track. */
export const CONTENT_PRODUCTION_ORDER = [
  'az900',
  'dp900',
  'ai901',
  'az104',
  'ai200',
  'sc500',
  'dp300',
  'dp700',
  'ai103',
  'az305',
  'az400',
] as const;

export type PlannedCertificationId = (typeof CONTENT_PRODUCTION_ORDER)[number];

/** Provisional launch-bank targets. These are content-planning totals, not mock-exam lengths. */
export const LAUNCH_CONTENT_TARGETS: Record<PlannedCertificationId, number> = {
  az900: 400,
  dp900: 350,
  ai901: 350,
  az104: 500,
  ai200: 500,
  sc500: 500,
  dp300: 450,
  dp700: 450,
  ai103: 500,
  az305: 450,
  az400: 500,
};

export const DEFAULT_UNDER_COVERED_RATIO = 0.4;
export const DEFAULT_OVER_COVERED_RATIO = 1.25;
export const DEFAULT_BATCH_SIZE = 50;
export const DEFAULT_STALE_DAYS = 180;

export function difficultyMixForLevel(level: DifficultyLevel): DifficultyMix {
  if (level === 'fundamentals') {
    return { beginner: 0.55, intermediate: 0.35, advanced: 0.1 };
  }
  if (level === 'expert' || level === 'specialty') {
    return { beginner: 0.15, intermediate: 0.45, advanced: 0.4 };
  }
  return { beginner: 0.25, intermediate: 0.5, advanced: 0.25 };
}

export function launchTargetFor(certificationId: string): number | null {
  return certificationId in LAUNCH_CONTENT_TARGETS
    ? LAUNCH_CONTENT_TARGETS[certificationId as PlannedCertificationId]
    : null;
}
