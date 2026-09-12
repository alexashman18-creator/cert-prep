import type { CoverageReport, LaunchReadinessStatus } from '@/content/blueprints/types';

export function determineLaunchReadiness(
  report: Pick<
    CoverageReport,
    | 'blueprintStatus'
    | 'missingBlueprint'
    | 'totals'
    | 'zeroCoverageObjectives'
    | 'zeroCoverageSubobjectives'
    | 'missingSourceIds'
    | 'staleVerifiedIds'
  >,
): { launchReadiness: LaunchReadinessStatus; launchReadinessReasons: string[] } {
  const reasons: string[] = [];

  if (report.missingBlueprint || report.blueprintStatus === 'missing') {
    return {
      launchReadiness: 'not_started',
      launchReadinessReasons: ['No content blueprint file exists for this certification.'],
    };
  }

  if (report.blueprintStatus === 'pending_verification') {
    return {
      launchReadiness: 'not_started',
      launchReadinessReasons: ['Official skills outline is still pending_verification.'],
    };
  }

  if (report.blueprintStatus === 'retired') {
    return {
      launchReadiness: 'not_started',
      launchReadinessReasons: ['Blueprint is retired and is not launchable.'],
    };
  }

  if (report.totals.verified === 0) {
    return {
      launchReadiness: 'blueprint_ready',
      launchReadinessReasons: ['Blueprint is verified but no verified production questions exist yet.'],
    };
  }

  if (report.zeroCoverageObjectives.length > 0) {
    reasons.push(
      `${report.zeroCoverageObjectives.length} official objective${report.zeroCoverageObjectives.length === 1 ? '' : 's'} have zero verified questions.`,
    );
  }
  if (report.zeroCoverageSubobjectives.length > 0) {
    reasons.push(
      `${report.zeroCoverageSubobjectives.length} official subobjective${report.zeroCoverageSubobjectives.length === 1 ? '' : 's'} have zero verified questions.`,
    );
  }
  if (report.totals.verified < report.totals.target) {
    reasons.push(`Verified count ${report.totals.verified} is below the ${report.totals.target} content target.`);
  }

  const qaIssues: string[] = [];
  if (report.missingSourceIds.length > 0) {
    qaIssues.push(`${report.missingSourceIds.length} verified question${report.missingSourceIds.length === 1 ? '' : 's'} missing sourceUrl/sourceTitle.`);
  }
  if (report.staleVerifiedIds.length > 0) {
    qaIssues.push(`${report.staleVerifiedIds.length} verified question${report.staleVerifiedIds.length === 1 ? '' : 's'} have stale or missing verifiedDate.`);
  }

  const uncoveredOrShort =
    report.zeroCoverageObjectives.length > 0 ||
    report.zeroCoverageSubobjectives.length > 0 ||
    report.totals.verified < report.totals.target;
  if (uncoveredOrShort) {
    reasons.push(...qaIssues);
    return { launchReadiness: 'content_in_progress', launchReadinessReasons: reasons };
  }

  if (qaIssues.length > 0) {
    return { launchReadiness: 'qa_required', launchReadinessReasons: qaIssues };
  }

  return {
    launchReadiness: 'launch_ready',
    launchReadinessReasons: ['Blueprint is verified, every official objective has coverage, and the content target is met.'],
  };
}
