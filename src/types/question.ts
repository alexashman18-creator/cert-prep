import type { DomainId } from '@/types/domain';

export const CONTENT_STATUSES = ['development', 'draft', 'verified', 'retired'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface AnswerOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  examVersion: string;
  domain: DomainId;
  objective: string;
  subobjective: string;
  difficulty: Difficulty;
  questionText: string;
  options: [AnswerOption, AnswerOption, AnswerOption, AnswerOption];
  correctAnswerId: string;
  explanation: string;
  optionExplanations: Record<string, string>;
  sourceUrl: string;
  sourceTitle: string;
  verifiedDate: string | null;
  questionVersion: number;
  contentStatus: ContentStatus;
}

export function isContentStatus(value: string): value is ContentStatus {
  return (CONTENT_STATUSES as readonly string[]).includes(value);
}

export function isDifficulty(value: string): value is Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(value);
}

export function assertQuestionShape(question: Question): void {
  if (question.options.length !== 4) {
    throw new Error(`Question ${question.id} must have exactly four options.`);
  }

  const optionIds = question.options.map((option) => option.id);
  if (new Set(optionIds).size !== 4) {
    throw new Error(`Question ${question.id} has duplicate option IDs.`);
  }

  if (!optionIds.includes(question.correctAnswerId)) {
    throw new Error(`Question ${question.id} correctAnswerId is not one of its options.`);
  }

  for (const option of question.options) {
    if (!question.optionExplanations[option.id]) {
      throw new Error(`Question ${question.id} is missing an explanation for option ${option.id}.`);
    }
  }

  if (!isContentStatus(question.contentStatus)) {
    throw new Error(`Question ${question.id} has unsupported contentStatus.`);
  }
}
