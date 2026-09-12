import type { DomainId } from '@/types/domain';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type ContentStatus = 'development_sample' | 'verified';

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
}
