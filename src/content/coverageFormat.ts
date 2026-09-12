import type { BatchRecommendation, CoverageReport, PlatformCoverageSummary } from '@/content/blueprints/types';

function flag(item: { zeroCoverage: boolean; underCovered: boolean; overCovered: boolean }): string {
  if (item.zeroCoverage) {
    return 'ZERO';
  }
  if (item.underCovered) {
    return 'LOW';
  }
  if (item.overCovered) {
    return 'OVER';
  }
  return 'ok';
}

function counts(item: { verified: number; draft: number; target: number; remaining: number; percentComplete: number }): string {
  return `${item.verified} verified / ${item.draft} draft / ${item.target} target · remaining ${item.remaining} · ${item.percentComplete}%`;
}

export function formatCoverageReport(report: CoverageReport): string {
  const lines = [
    `${report.examCode} — ${report.displayName}`,
    `Blueprint: ${report.blueprintStatus}${report.skillsOutlineEffectiveDate ? ` · outline ${report.skillsOutlineEffectiveDate}` : ''}`,
    `Launch readiness: ${report.launchReadiness}`,
    ...report.launchReadinessReasons.map((reason) => `  - ${reason}`),
    `Target: ${report.totals.target}`,
    `Verified: ${report.totals.verified}`,
    `Draft: ${report.totals.draft}`,
    `Remaining: ${report.totals.remaining}`,
    `Complete: ${report.totals.percentComplete}%`,
    '',
    'By domain:',
  ];

  if (report.byDomain.length === 0) {
    lines.push('  (none — official domains have not been verified)');
  }

  for (const domain of report.byDomain) {
    lines.push(`  [${flag(domain)}] ${domain.label} (${Math.round(domain.weight * 100)}%): ${counts(domain)}`);
    for (const objective of domain.objectives) {
      lines.push(`    [${flag(objective)}] ${objective.label}: ${counts(objective)}`);
      for (const subobjective of objective.subobjectives) {
        lines.push(`      [${flag(subobjective)}] ${subobjective.label}: ${counts(subobjective)}`);
      }
    }
  }

  lines.push('', 'By difficulty:');
  for (const item of report.byDifficulty) {
    lines.push(`  ${item.difficulty}: ${counts(item)}`);
  }

  lines.push('', `Objectives with zero verified questions: ${report.zeroCoverageObjectives.length}`);
  for (const label of report.zeroCoverageObjectives) {
    lines.push(`  - ${label}`);
  }
  lines.push(`Subobjectives with zero verified questions: ${report.zeroCoverageSubobjectives.length}`);
  for (const label of report.zeroCoverageSubobjectives) {
    lines.push(`  - ${label}`);
  }
  lines.push(`Under-covered objectives: ${report.underCoveredObjectives.length}`);
  for (const label of report.underCoveredObjectives) {
    lines.push(`  - ${label}`);
  }
  lines.push(`Over-covered objectives: ${report.overCoveredObjectives.length}`);
  for (const label of report.overCoveredObjectives) {
    lines.push(`  - ${label}`);
  }

  if (report.unmappedVerifiedIds.length > 0) {
    lines.push('', `Unmapped verified questions: ${report.unmappedVerifiedIds.join(', ')}`);
  }
  if (report.missingSourceIds.length > 0) {
    lines.push(`Missing source information: ${report.missingSourceIds.join(', ')}`);
  }
  lines.push(`Verified dates older than ${report.staleDays} days, or missing: ${report.staleVerifiedIds.length}`);
  if (report.staleVerifiedIds.length > 0) {
    lines.push(`  ${report.staleVerifiedIds.join(', ')}`);
  }

  return lines.join('\n');
}

export function formatBatchRecommendation(recommendation: BatchRecommendation): string {
  const lines = [
    '',
    `Recommended next batch for ${recommendation.examCode} (${recommendation.batchSize} items, ${recommendation.remainingToTarget} remaining to target):`,
  ];
  if (recommendation.items.length === 0) {
    lines.push('  No remaining official targets.');
    return lines.join('\n');
  }
  for (const item of recommendation.items) {
    const topic = item.subobjectiveLabel ?? item.objectiveLabel;
    lines.push(
      `  +${item.suggestedCount}  [${item.reason}] ${item.domainLabel} · ${item.objectiveLabel} · ${topic}  (${item.verified}/${item.target})`,
    );
  }
  return lines.join('\n');
}

export function formatPlatformCoverage(summary: PlatformCoverageSummary): string {
  const lines = [
    'Content coverage — all configured certifications',
    'A certification is never user-available from this report alone. Catalog status stays separate.',
    '',
    'Exam     Blueprint              Verified/Target   Ready              Notes',
  ];
  for (const id of summary.productionOrder) {
    const report = summary.certifications.find((item) => item.certificationId === id);
    if (!report) {
      lines.push(`${id.padEnd(8)} missing                0/—               not_started        No blueprint file`);
      continue;
    }
    const note =
      report.blueprintStatus === 'pending_verification'
        ? 'Needs official outline verification'
        : report.zeroCoverageObjectives.length > 0
          ? `${report.zeroCoverageObjectives.length} objectives at zero`
          : report.launchReadinessReasons[0] ?? '';
    lines.push(
      `${report.examCode.padEnd(8)} ${report.blueprintStatus.padEnd(22)} ${String(report.totals.verified).padStart(4)}/${String(report.totals.target).padEnd(6)} ${report.launchReadiness.padEnd(18)} ${note}`,
    );
  }
  const missingVerifiedBlueprints = summary.certifications.filter(
    (item) => item.missingBlueprint || item.blueprintStatus === 'pending_verification' || item.blueprintStatus === 'missing',
  );
  lines.push('', `Certifications without a verified blueprint: ${missingVerifiedBlueprints.length}`);
  for (const item of missingVerifiedBlueprints) {
    lines.push(`  - ${item.examCode}`);
  }
  return lines.join('\n');
}
