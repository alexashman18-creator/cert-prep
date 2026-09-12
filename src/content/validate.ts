import {
  DEVELOPMENT_QUESTION_ID_PREFIX,
  QUESTION_BANK_EXAM,
  QUESTION_BANK_SCHEMA_VERSION,
  type QuestionBankFile,
  type QuestionSourceRecord,
  type ValidationIssue,
  type ValidationResult,
} from '@/content/types';
import { isDomainId } from '@/types/domain';
import { CONTENT_STATUSES, isContentStatus, isDifficulty } from '@/types/question';

function issue(path: string, message: string): ValidationIssue {
  return { path, message };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/.test(value)) {
    return false;
  }
  const parsed = Date.parse(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  return !Number.isNaN(parsed);
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateQuestionSource(
  raw: unknown,
  path: string,
  options?: { allowDevelopmentIds?: boolean },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const record = asRecord(raw);
  if (!record) {
    return [issue(path, 'Question must be an object.')];
  }

  const id = readString(record.id);
  if (!id || !isNonEmpty(id)) {
    issues.push(issue(`${path}.id`, 'id is required.'));
  } else if (id !== id.trim()) {
    issues.push(issue(`${path}.id`, 'id must not include leading or trailing whitespace.'));
  } else if (!options?.allowDevelopmentIds && id.startsWith(DEVELOPMENT_QUESTION_ID_PREFIX)) {
    issues.push(
      issue(
        `${path}.id`,
        `IDs starting with ${DEVELOPMENT_QUESTION_ID_PREFIX} are reserved for bundled development samples.`,
      ),
    );
  }

  const examVersion = readString(record.examVersion);
  if (!examVersion || !isNonEmpty(examVersion)) {
    issues.push(issue(`${path}.examVersion`, 'examVersion is required.'));
  }

  const domain = readString(record.domain);
  if (!domain) {
    issues.push(issue(`${path}.domain`, 'domain is required.'));
  } else if (!isDomainId(domain)) {
    issues.push(
      issue(
        `${path}.domain`,
        `invalid domain "${domain}". Use cloud_concepts, architecture_services, or management_governance.`,
      ),
    );
  }

  for (const field of ['objective', 'subobjective', 'questionText'] as const) {
    const value = readString(record[field]);
    if (!value || !isNonEmpty(value)) {
      issues.push(issue(`${path}.${field}`, `${field} is required.`));
    }
  }

  const difficulty = readString(record.difficulty);
  if (!difficulty) {
    issues.push(issue(`${path}.difficulty`, 'difficulty is required.'));
  } else if (!isDifficulty(difficulty)) {
    issues.push(
      issue(
        `${path}.difficulty`,
        `invalid difficulty "${difficulty}". Use beginner, intermediate, or advanced.`,
      ),
    );
  }

  const optionsValue = record.options;
  if (!Array.isArray(optionsValue)) {
    issues.push(issue(`${path}.options`, 'options must be an array of exactly four answers.'));
  } else if (optionsValue.length !== 4) {
    issues.push(
      issue(`${path}.options`, `expected exactly four answers, received ${optionsValue.length}.`),
    );
  } else {
    const optionIds: string[] = [];
    optionsValue.forEach((option, index) => {
      const optionPath = `${path}.options[${index}]`;
      const optionRecord = asRecord(option);
      if (!optionRecord) {
        issues.push(issue(optionPath, 'Each option must be an object with id and text.'));
        return;
      }
      const optionId = readString(optionRecord.id);
      const text = readString(optionRecord.text);
      if (!optionId || !isNonEmpty(optionId)) {
        issues.push(issue(`${optionPath}.id`, 'option id is required.'));
      } else {
        optionIds.push(optionId);
      }
      if (!text || !isNonEmpty(text)) {
        issues.push(issue(`${optionPath}.text`, 'option text is required.'));
      }
    });
    if (optionIds.length === 4 && new Set(optionIds).size !== 4) {
      issues.push(issue(`${path}.options`, 'option IDs must be unique.'));
    }

    const correctAnswerId = readString(record.correctAnswerId);
    if (!correctAnswerId || !isNonEmpty(correctAnswerId)) {
      issues.push(issue(`${path}.correctAnswerId`, 'correctAnswerId is required.'));
    } else if (optionIds.length === 4 && !optionIds.includes(correctAnswerId)) {
      issues.push(
        issue(
          `${path}.correctAnswerId`,
          `correctAnswerId "${correctAnswerId}" does not match an option.`,
        ),
      );
    }

    const overallExplanation = readString(record.overallExplanation);
    if (!overallExplanation || !isNonEmpty(overallExplanation)) {
      issues.push(issue(`${path}.overallExplanation`, 'overallExplanation is required.'));
    }

    const optionExplanations = asRecord(record.optionExplanations);
    if (!optionExplanations) {
      issues.push(issue(`${path}.optionExplanations`, 'optionExplanations is required.'));
    } else {
      for (const optionId of optionIds) {
        const explanation = readString(optionExplanations[optionId]);
        if (!explanation || !isNonEmpty(explanation)) {
          issues.push(
            issue(
              `${path}.optionExplanations.${optionId}`,
              `missing explanation for option ${optionId}.`,
            ),
          );
        }
      }
    }
  }

  const contentStatus = readString(record.contentStatus);
  if (!contentStatus) {
    issues.push(issue(`${path}.contentStatus`, 'contentStatus is required.'));
  } else if (!isContentStatus(contentStatus)) {
    issues.push(
      issue(
        `${path}.contentStatus`,
        `unsupported contentStatus "${contentStatus}". Use ${CONTENT_STATUSES.join(', ')}.`,
      ),
    );
  }

  const questionVersion = record.questionVersion;
  if (typeof questionVersion !== 'number' || !Number.isInteger(questionVersion) || questionVersion < 1) {
    issues.push(issue(`${path}.questionVersion`, 'questionVersion must be an integer of 1 or greater.'));
  }

  const sourceUrl = readString(record.sourceUrl);
  const sourceTitle = readString(record.sourceTitle);
  const verifiedDate = record.verifiedDate === null ? null : readString(record.verifiedDate);

  if (record.verifiedDate !== null && record.verifiedDate !== undefined && verifiedDate === null) {
    issues.push(issue(`${path}.verifiedDate`, 'verifiedDate must be an ISO date string or null.'));
  }
  if (verifiedDate && !isIsoDate(verifiedDate)) {
    issues.push(issue(`${path}.verifiedDate`, 'verifiedDate must be YYYY-MM-DD or an ISO timestamp.'));
  }

  if (contentStatus === 'verified') {
    if (!sourceUrl || !isNonEmpty(sourceUrl)) {
      issues.push(issue(`${path}.sourceUrl`, 'sourceUrl is required for verified questions.'));
    } else if (!isHttpUrl(sourceUrl)) {
      issues.push(issue(`${path}.sourceUrl`, 'sourceUrl must be an http(s) URL for verified questions.'));
    }
    if (!sourceTitle || !isNonEmpty(sourceTitle)) {
      issues.push(issue(`${path}.sourceTitle`, 'sourceTitle is required for verified questions.'));
    }
    if (!verifiedDate) {
      issues.push(issue(`${path}.verifiedDate`, 'verifiedDate is required for verified questions.'));
    }
  }

  return issues;
}

export function validateQuestionBankFile(
  raw: unknown,
  options?: { fileLabel?: string; allowDevelopmentIds?: boolean },
): ValidationResult {
  const label = options?.fileLabel ?? 'bank';
  const issues: ValidationIssue[] = [];
  const file = asRecord(raw);
  if (!file) {
    return { ok: false, issues: [issue(label, 'Question bank file must be a JSON object.')] };
  }

  if (file.schemaVersion !== QUESTION_BANK_SCHEMA_VERSION) {
    issues.push(
      issue(
        `${label}.schemaVersion`,
        `schemaVersion must be ${QUESTION_BANK_SCHEMA_VERSION}.`,
      ),
    );
  }

  const exam = readString(file.exam);
  if (!exam || exam !== QUESTION_BANK_EXAM) {
    issues.push(issue(`${label}.exam`, `exam must be "${QUESTION_BANK_EXAM}".`));
  }

  if (file.batchId !== undefined) {
    const batchId = readString(file.batchId);
    if (!batchId || !isNonEmpty(batchId)) {
      issues.push(issue(`${label}.batchId`, 'batchId must be a non-empty string when provided.'));
    }
  }

  if (!Array.isArray(file.questions)) {
    issues.push(issue(`${label}.questions`, 'questions must be an array.'));
    return { ok: false, issues };
  }

  const seen = new Map<string, number>();
  file.questions.forEach((question, index) => {
    const path = `${label}.questions[${index}]`;
    issues.push(...validateQuestionSource(question, path, options));
    const id = asRecord(question) && readString(asRecord(question)?.id);
    if (id) {
      const previous = seen.get(id);
      if (previous !== undefined) {
        issues.push(
          issue(`${path}.id`, `duplicate ID "${id}" also appears at ${label}.questions[${previous}].`),
        );
      } else {
        seen.set(id, index);
      }
    }
  });

  return { ok: issues.length === 0, issues };
}

export function assertValidQuestionBank(result: ValidationResult, label = 'Question bank'): void {
  if (result.ok) {
    return;
  }
  const details = result.issues.map((item) => `${item.path}: ${item.message}`).join('\n');
  throw new Error(`${label} is malformed and was rejected.\n${details}`);
}

export function asQuestionBankFile(raw: unknown): QuestionBankFile {
  const result = validateQuestionBankFile(raw);
  assertValidQuestionBank(result);
  return raw as QuestionBankFile;
}

export function asQuestionSourceRecords(raw: unknown): QuestionSourceRecord[] {
  return asQuestionBankFile(raw).questions;
}
