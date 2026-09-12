import { BLUEPRINT_SCHEMA_VERSION, BLUEPRINT_STATUSES, type CertificationBlueprint } from '@/content/blueprints/types';

export interface BlueprintIssue {
  path: string;
  message: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 2;
}

function mixSum(mix: { beginner?: unknown; intermediate?: unknown; advanced?: unknown }): number {
  return (
    (typeof mix.beginner === 'number' ? mix.beginner : 0) +
    (typeof mix.intermediate === 'number' ? mix.intermediate : 0) +
    (typeof mix.advanced === 'number' ? mix.advanced : 0)
  );
}

export function validateCertificationBlueprint(raw: unknown, fileLabel = 'blueprint'): BlueprintIssue[] {
  const issues: BlueprintIssue[] = [];
  if (!isRecord(raw)) {
    return [{ path: fileLabel, message: 'Blueprint must be an object.' }];
  }

  if (raw.schemaVersion !== BLUEPRINT_SCHEMA_VERSION) {
    issues.push({ path: `${fileLabel}.schemaVersion`, message: `schemaVersion must be ${BLUEPRINT_SCHEMA_VERSION}.` });
  }
  if (!isNonEmptyString(raw.certificationId)) {
    issues.push({ path: `${fileLabel}.certificationId`, message: 'certificationId is required.' });
  }
  if (!isNonEmptyString(raw.examCode)) {
    issues.push({ path: `${fileLabel}.examCode`, message: 'examCode is required.' });
  }
  if (!isNonEmptyString(raw.displayName)) {
    issues.push({ path: `${fileLabel}.displayName`, message: 'displayName is required.' });
  }
  if (!BLUEPRINT_STATUSES.includes(raw.blueprintStatus as never)) {
    issues.push({
      path: `${fileLabel}.blueprintStatus`,
      message: `blueprintStatus must be one of ${BLUEPRINT_STATUSES.join(', ')}.`,
    });
  }
  if (raw.skillsOutlineEffectiveDate !== null && !isNonEmptyString(raw.skillsOutlineEffectiveDate)) {
    issues.push({
      path: `${fileLabel}.skillsOutlineEffectiveDate`,
      message: 'skillsOutlineEffectiveDate must be a YYYY-MM-DD string or null.',
    });
  }
  if (raw.studyGuideUrl !== null && !isNonEmptyString(raw.studyGuideUrl)) {
    issues.push({ path: `${fileLabel}.studyGuideUrl`, message: 'studyGuideUrl must be a URL string or null.' });
  }
  if (typeof raw.contentTargetCount !== 'number' || raw.contentTargetCount < 0) {
    issues.push({ path: `${fileLabel}.contentTargetCount`, message: 'contentTargetCount must be a non-negative number.' });
  }
  if (!isRecord(raw.difficultyMix) || Math.abs(mixSum(raw.difficultyMix) - 1) > 0.001) {
    issues.push({ path: `${fileLabel}.difficultyMix`, message: 'difficultyMix beginner/intermediate/advanced must sum to 1.' });
  }
  if (!isRatio(raw.underCoveredRatio) || !isRatio(raw.overCoveredRatio)) {
    issues.push({
      path: `${fileLabel}.thresholds`,
      message: 'underCoveredRatio and overCoveredRatio must be finite numbers.',
    });
  }
  if (!Array.isArray(raw.domains)) {
    issues.push({ path: `${fileLabel}.domains`, message: 'domains must be an array.' });
    return issues;
  }

  if (raw.blueprintStatus === 'pending_verification' && raw.domains.length > 0) {
    issues.push({
      path: `${fileLabel}.domains`,
      message: 'pending_verification blueprints must not invent domains or objectives.',
    });
  }

  if (raw.blueprintStatus === 'verified' && raw.domains.length === 0) {
    issues.push({
      path: `${fileLabel}.domains`,
      message: 'verified blueprints must include official domains and objectives.',
    });
  }

  let domainTargetSum = 0;
  let weightSum = 0;
  const domainIds = new Set<string>();

  raw.domains.forEach((domainRaw, domainIndex) => {
    const domainPath = `${fileLabel}.domains[${domainIndex}]`;
    if (!isRecord(domainRaw)) {
      issues.push({ path: domainPath, message: 'Domain must be an object.' });
      return;
    }
    if (!isNonEmptyString(domainRaw.id) || domainIds.has(domainRaw.id)) {
      issues.push({ path: `${domainPath}.id`, message: 'Domain id is required and must be unique.' });
    } else {
      domainIds.add(domainRaw.id);
    }
    if (typeof domainRaw.targetCount === 'number') {
      domainTargetSum += domainRaw.targetCount;
    }
    if (typeof domainRaw.weight === 'number') {
      weightSum += domainRaw.weight;
    }
    if (!Array.isArray(domainRaw.objectives)) {
      issues.push({ path: `${domainPath}.objectives`, message: 'objectives must be an array.' });
      return;
    }

    let objectiveTargetSum = 0;
    domainRaw.objectives.forEach((objectiveRaw, objectiveIndex) => {
      const objectivePath = `${domainPath}.objectives[${objectiveIndex}]`;
      if (!isRecord(objectiveRaw)) {
        issues.push({ path: objectivePath, message: 'Objective must be an object.' });
        return;
      }
      if (typeof objectiveRaw.targetCount === 'number') {
        objectiveTargetSum += objectiveRaw.targetCount;
      }
      if (!Array.isArray(objectiveRaw.subobjectives)) {
        issues.push({ path: `${objectivePath}.subobjectives`, message: 'subobjectives must be an array.' });
        return;
      }
      let subTargetSum = 0;
      for (const subRaw of objectiveRaw.subobjectives) {
        if (isRecord(subRaw) && typeof subRaw.targetCount === 'number') {
          subTargetSum += subRaw.targetCount;
        }
      }
      if (typeof objectiveRaw.targetCount === 'number' && subTargetSum !== objectiveRaw.targetCount) {
        issues.push({
          path: `${objectivePath}.targetCount`,
          message: `Objective target ${objectiveRaw.targetCount} does not equal subobjective targets ${subTargetSum}.`,
        });
      }
    });

    if (typeof domainRaw.targetCount === 'number' && objectiveTargetSum !== domainRaw.targetCount) {
      issues.push({
        path: `${domainPath}.targetCount`,
        message: `Domain target ${domainRaw.targetCount} does not equal objective targets ${objectiveTargetSum}.`,
      });
    }
  });

  if (
    raw.blueprintStatus === 'verified' &&
    typeof raw.contentTargetCount === 'number' &&
    domainTargetSum !== raw.contentTargetCount
  ) {
    issues.push({
      path: `${fileLabel}.contentTargetCount`,
      message: `contentTargetCount ${raw.contentTargetCount} does not equal domain targets ${domainTargetSum}.`,
    });
  }

  if (raw.blueprintStatus === 'verified' && raw.domains.length > 0 && Math.abs(weightSum - 1) > 0.001) {
    issues.push({ path: `${fileLabel}.domains`, message: 'Domain weights must sum to 1.' });
  }

  return issues;
}

export function assertValidBlueprint(raw: unknown, fileLabel = 'blueprint'): asserts raw is CertificationBlueprint {
  const issues = validateCertificationBlueprint(raw, fileLabel);
  if (issues.length > 0) {
    throw new Error(issues.map((item) => `${item.path}: ${item.message}`).join('\n'));
  }
}
