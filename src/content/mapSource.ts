import type { QuestionSourceRecord } from '@/content/types';
import type { AnswerOption, Question } from '@/types/question';

export function mapSourceQuestion(record: QuestionSourceRecord): Question {
  const options = record.options.map((option) => ({
    id: option.id,
    text: option.text,
  })) as [AnswerOption, AnswerOption, AnswerOption, AnswerOption];

  return {
    id: record.id,
    examVersion: record.examVersion,
    domain: record.domain,
    objective: record.objective,
    subobjective: record.subobjective,
    difficulty: record.difficulty,
    questionText: record.questionText,
    options,
    correctAnswerId: record.correctAnswerId,
    explanation: record.overallExplanation,
    optionExplanations: { ...record.optionExplanations },
    sourceUrl: record.sourceUrl ?? '',
    sourceTitle: record.sourceTitle ?? '',
    verifiedDate: record.verifiedDate,
    questionVersion: record.questionVersion,
    contentStatus: record.contentStatus,
  };
}

export function mapSourceQuestions(records: readonly QuestionSourceRecord[]): Question[] {
  return records.map(mapSourceQuestion);
}
