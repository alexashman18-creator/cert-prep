import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { listCertifications, resolveCertificationId } from '@/certifications';
import {
  CONTENT_PRODUCTION_ORDER,
  LAUNCH_CONTENT_TARGETS,
} from '@/content/blueprints/launchTargets';
import type { CertificationBlueprint, CoverageReport, PlatformCoverageSummary } from '@/content/blueprints/types';
import { assertValidBlueprint } from '@/content/blueprints/validate';
import { buildCoverageReport } from '@/content/coverage';
import { mapSourceQuestions } from '@/content/mapSource';
import type { QuestionBankFile } from '@/content/types';
import { validateQuestionBankFile } from '@/content/validate';
import type { Question } from '@/types/question';

const ROOT = process.cwd();
export const BLUEPRINT_DIR = path.join(ROOT, 'content/blueprints');
export const BATCH_DIR = path.join(ROOT, 'content/questions/batches');

async function readJson(filePath: string): Promise<unknown> {
  return JSON.parse(await readFile(filePath, 'utf8')) as unknown;
}

export async function loadBlueprintFile(filePath: string): Promise<CertificationBlueprint> {
  const label = path.relative(ROOT, filePath);
  const raw = await readJson(filePath);
  assertValidBlueprint(raw, label);
  return raw;
}

export async function loadBlueprint(certificationId: string): Promise<CertificationBlueprint | null> {
  const filePath = path.join(BLUEPRINT_DIR, `${certificationId}.json`);
  try {
    return await loadBlueprintFile(filePath);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function listBatchFiles(dir: string): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...(await listBatchFiles(full)));
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        files.push(full);
      }
    }
    return files.sort();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Load production questions for one certification from its batch folder only.
 * Does not load the bundled catalog or other certifications.
 */
export async function loadProductionQuestionsForCertification(certificationId: string): Promise<Question[]> {
  const files = await listBatchFiles(path.join(BATCH_DIR, certificationId));
  const questions: Question[] = [];
  const issues: string[] = [];

  for (const filePath of files) {
    const label = path.relative(ROOT, filePath);
    const raw = await readJson(filePath);
    const result = validateQuestionBankFile(raw, { fileLabel: label, allowDevelopmentIds: false });
    if (!result.ok) {
      issues.push(...result.issues.map((issue) => `${issue.path}: ${issue.message}`));
      continue;
    }
    questions.push(...mapSourceQuestions((raw as QuestionBankFile).questions, raw as QuestionBankFile));
  }

  if (issues.length > 0) {
    throw new Error(`Question bank validation failed for ${certificationId}:\n${issues.join('\n')}`);
  }

  return questions.filter((question) => question.certificationId === certificationId);
}

export async function buildCertificationCoverage(
  certificationKey: string,
  options?: { staleDays?: number; nowMs?: number },
): Promise<CoverageReport> {
  const certificationId = resolveCertificationId(certificationKey) ?? certificationKey;
  const catalogEntry = listCertifications().find((item) => item.id === certificationId);
  const blueprint = await loadBlueprint(certificationId);
  const questions = await loadProductionQuestionsForCertification(certificationId);
  return buildCoverageReport({
    blueprint,
    questions,
    staleDays: options?.staleDays,
    nowMs: options?.nowMs,
    certificationId,
    examCode: blueprint?.examCode ?? catalogEntry?.examCode ?? certificationKey,
    displayName: blueprint?.displayName ?? catalogEntry?.displayName ?? certificationKey,
  });
}

export async function buildPlatformCoverage(options?: {
  staleDays?: number;
  nowMs?: number;
}): Promise<PlatformCoverageSummary> {
  const certifications: CoverageReport[] = [];
  for (const id of CONTENT_PRODUCTION_ORDER) {
    certifications.push(await buildCertificationCoverage(id, options));
  }
  return {
    certifications,
    launchTargets: { ...LAUNCH_CONTENT_TARGETS },
    productionOrder: [...CONTENT_PRODUCTION_ORDER],
  };
}
