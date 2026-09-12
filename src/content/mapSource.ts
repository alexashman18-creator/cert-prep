import { DEFAULT_CERTIFICATION_ID, getCertificationByExamCode } from '@/certifications';
import type { QuestionBankFile, QuestionSourceRecord } from '@/content/types';
import type { AnswerOption, Question } from '@/types/question';

export function resolveSourceCertificationId(
  record: QuestionSourceRecord,
  bank?: Pick<QuestionBankFile, 'exam' | 'certificationId'>,
): string {
  if (record.certificationId?.trim()) {
    return record.certificationId;
  }
  if (bank?.certificationId?.trim()) {
    return bank.certificationId;
  }
  if (bank?.exam) {
    return getCertificationByExamCode(bank.exam)?.id ?? DEFAULT_CERTIFICATION_ID;
  }
  return DEFAULT_CERTIFICATION_ID;
}

export function mapSourceQuestion(
  record: QuestionSourceRecord,
  bank?: Pick<QuestionBankFile, 'exam' | 'certificationId'>,
): Question {
  const options = record.options.map((option) => ({
    id: option.id,
    text: option.text,
  })) as [AnswerOption, AnswerOption, AnswerOption, AnswerOption];

  return {
    id: record.id,
    certificationId: resolveSourceCertificationId(record, bank),
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

export function mapSourceQuestions(
  records: readonly QuestionSourceRecord[],
  bank?: Pick<QuestionBankFile, 'exam' | 'certificationId'>,
): Question[] {
  return records.map((record) => mapSourceQuestion(record, bank));
}
