import type { ContentStatus, Difficulty } from '@/types/question';
import type { DomainId } from '@/types/domain';

export const QUESTION_BANK_SCHEMA_VERSION = 1;
export const QUESTION_BANK_EXAM = 'AZ-900';
export const DEVELOPMENT_QUESTION_ID_PREFIX = 'az900-dev-';

export type BankContentStatus = ContentStatus;

export interface QuestionSourceOption {
  id: string;
  text: string;
}

export interface QuestionSourceRecord {
  id: string;
  certificationId?: string;
  examVersion: string;
  domain: DomainId;
  objective: string;
  subobjective: string;
  difficulty: Difficulty;
  questionText: string;
  options: QuestionSourceOption[];
  correctAnswerId: string;
  overallExplanation: string;
  optionExplanations: Record<string, string>;
  sourceUrl: string;
  sourceTitle: string;
  verifiedDate: string | null;
  questionVersion: number;
  contentStatus: BankContentStatus;
}

export interface QuestionBankFile {
  schemaVersion: number;
  exam: string;
  certificationId?: string;
  batchId?: string;
  questions: QuestionSourceRecord[];
}

export interface ProductionCatalogFile {
  schemaVersion: number;
  batchId?: string;
  exam?: string;
  certificationId?: string;
  questions?: QuestionSourceRecord[];
  banks?: QuestionBankFile[];
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}
